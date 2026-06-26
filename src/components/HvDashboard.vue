<template>
  <div class="hv-wrap">
    <h2 class="text-xl font-bold">HV Control and Monitor</h2>
    <div v-if="!normalizedApiBase" class="text-red-700 font-semibold">
      API is not registered for part 'hv-monitor'. Configure it in UI Setting.
    </div>
    <div v-else>
      <p class="mb-2">Registered API: {{ normalizedApiBase }}</p>

      <div class="panel">
        <div class="actions-row">
          <button class="btn btn-gray" @click="loadModules">Reload Modules</button>
        </div>

        <div class="grid-form">
          <div>
            <label class="label">Bulk Voltage</label>
            <input v-model.number="bulkVoltage" type="number" class="inpt" min="0" max="2000" step="1">
          </div>
          <div>
            <label class="label">Bulk Current Limit</label>
            <input v-model.number="bulkCurrentLimit" type="number" class="inpt" min="0" max="1000" step="1">
          </div>
          <div>
            <label class="label">Bulk Ramp Speed</label>
            <input v-model.number="bulkRampSpeed" type="number" class="inpt" min="0" max="255" step="1">
          </div>
        </div>

        <div class="actions-row">
          <button class="btn btn-blue" :disabled="rows.length === 0" @click="reflectBulkToChecked">Reflect To Checked</button>
          <button class="btn btn-blue" :disabled="rows.length === 0" @click="applySelectedOn">Apply ON To Checked</button>
          <button class="btn btn-red" :disabled="rows.length === 0" @click="applySelectedOff">OFF Checked</button>
          <button class="btn btn-gray" :disabled="rows.length === 0" @click="readStatusAll">Read All Now</button>
        </div>

        <div v-if="rows.length === 0" class="text-gray-600 text-sm mt-3">No registered module</div>

        <table v-else class="channel-table mt-3">
          <thead>
            <tr>
              <th>
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll($event)">
              </th>
              <th>Target</th>
              <th>Set Voltage</th>
              <th>Current Limit</th>
              <th>Ramp Speed</th>
              <th>Measured V</th>
              <th>Measured I</th>
              <th>State</th>
              <th>Last Update</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td>
                <input type="checkbox" v-model="row.selected">
              </td>
              <td>{{ row.module }} ch{{ row.ch }}</td>
              <td>
                <input v-model.number="row.setVoltage" type="number" class="inpt" min="0" max="2000" step="1">
              </td>
              <td>
                <input v-model.number="row.currentLimit" type="number" class="inpt" min="0" max="1000" step="1">
              </td>
              <td>
                <input v-model.number="row.rampSpeed" type="number" class="inpt" min="0" max="255" step="1">
              </td>
              <td>{{ displayVal(row.measuredVoltage) }}</td>
              <td>{{ displayVal(row.measuredCurrent) }}</td>
              <td>
                <span class="row-badge" :class="row.error ? 'row-badge-ng' : 'row-badge-ok'">
                  {{ row.error ? 'NG' : 'OK' }}
                </span>
              </td>
              <td>{{ displayTs(row.lastTimestamp) }}</td>
              <td>
                <button class="btn btn-blue" @click="applyOn(row)">ON</button>
                <button class="btn btn-red" @click="applyOff(row)">OFF</button>
                <button class="btn btn-gray" @click="readStatus(row)">Read</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-2 text-sm text-red-700">
          <div v-for="row in rows" :key="`err-${row.key}`" v-show="row.error">
            {{ row.module }} ch{{ row.ch }}: {{ row.error }}
          </div>
        </div>

        <div class="status-box">
          <div v-if="lastError" class="text-red-700"><span class="k">Error:</span> {{ lastError }}</div>
          <div v-if="message" class="text-teal-800">{{ message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HvDashboard',
  props: {
    apiBase: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      modules: [],
      rows: [],
      bulkVoltage: 0,
      bulkCurrentLimit: 100,
      bulkRampSpeed: 10,
      pollTick: 0,
      lastError: '',
      message: '',
      timerId: null,
    };
  },
  computed: {
    normalizedApiBase() {
      return String(this.apiBase || '').replace(/\/$/, '');
    },
    allSelected() {
      return this.rows.length > 0 && this.rows.every((row) => row.selected);
    },
  },
  methods: {
    rph032(path) {
      return `${this.normalizedApiBase}/rph032${path}`;
    },
    syncRowsFromModules() {
      const keepKeys = new Set();
      const byKey = {};
      for (const row of this.rows) {
        byKey[row.key] = row;
      }

      const nextRows = [];
      for (const item of this.modules) {
        for (const ch of [1, 2, 3, 4]) {
          const key = `${item.module}::${ch}`;
          keepKeys.add(key);
          if (byKey[key]) {
            nextRows.push(byKey[key]);
          } else {
            nextRows.push({
              key,
              module: item.module,
              ch,
              selected: false,
              setVoltage: 0,
              currentLimit: 100,
              rampSpeed: 10,
              measuredVoltage: null,
              measuredCurrent: null,
              lastTimestamp: null,
              error: '',
            });
          }
        }
      }
      this.rows = nextRows;
    },
    async loadModules() {
      if (!this.normalizedApiBase) {
        return;
      }
      try {
        const response = await axios.get(this.rph032('/config/list'));
        this.modules = Array.isArray(response.data?.modules) ? response.data.modules : [];
        this.syncRowsFromModules();
      } catch (e) {
        this.lastError = this.describeError(e);
      }
    },
    async readStatus(row) {
      if (!this.normalizedApiBase) {
        return;
      }
      try {
        const statusRes = await axios.get(this.rph032(`/${encodeURIComponent(row.module)}/status/${row.ch}`));
        row.measuredVoltage = statusRes.data?.voltage ?? null;
        row.measuredCurrent = statusRes.data?.current ?? null;
        row.lastTimestamp = statusRes.data?.timestamp ?? null;
        row.error = statusRes.data?.error || '';

        const toNum = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };

        const svFromStatus = toNum(statusRes.data?.set_voltage);
        const clFromStatus = toNum(statusRes.data?.current_limit);
        const rampFromStatus = toNum(statusRes.data?.ramp);
        if (svFromStatus !== null) {
          row.setVoltage = svFromStatus;
        }
        if (clFromStatus !== null) {
          row.currentLimit = clFromStatus;
        }
        if (rampFromStatus !== null) {
          row.rampSpeed = rampFromStatus;
        }

        // Setting readback endpoint may not exist on older backend versions.
        try {
          const settingRes = await axios.get(this.rph032(`/${encodeURIComponent(row.module)}/setting/${row.ch}`));
          const setVoltage = toNum(settingRes.data?.set_voltage);
          const currentLimit = toNum(settingRes.data?.current_limit);
          const ramp = toNum(settingRes.data?.ramp);
          if (setVoltage !== null) {
            row.setVoltage = setVoltage;
          }
          if (currentLimit !== null) {
            row.currentLimit = currentLimit;
          }
          if (ramp !== null) {
            row.rampSpeed = ramp;
          }
        } catch (_e) {
          // Ignore setting readback errors so measured values remain visible.
        }
      } catch (e) {
        row.error = this.describeError(e);
      }
    },
    async readStatusAll() {
      await Promise.all(this.rows.map((row) => this.readStatus(row)));
    },
    async applyOn(row) {
      if (!this.normalizedApiBase) {
        return;
      }
      try {
        await axios.get(this.rph032(`/${encodeURIComponent(row.module)}/on/${row.ch}/${row.setVoltage}`), {
          params: { limit: row.currentLimit, ramp: row.rampSpeed },
        });
        this.message = `Applied ON: ${row.module} ch${row.ch}`;
        await this.readStatus(row);
      } catch (e) {
        row.error = this.describeError(e);
      }
    },
    async applyOff(row) {
      if (!this.normalizedApiBase) {
        return;
      }
      try {
        await axios.get(this.rph032(`/${encodeURIComponent(row.module)}/off/${row.ch}`));
        this.message = `Applied OFF: ${row.module} ch${row.ch}`;
        await this.readStatus(row);
      } catch (e) {
        row.error = this.describeError(e);
      }
    },
    reflectBulkToChecked() {
      for (const row of this.rows) {
        if (row.selected) {
          row.setVoltage = this.bulkVoltage;
          row.currentLimit = this.bulkCurrentLimit;
          row.rampSpeed = this.bulkRampSpeed;
        }
      }
      this.message = 'Reflected bulk values to checked rows';
    },
    async applySelectedOn() {
      const selected = this.rows.filter((row) => row.selected);
      if (selected.length === 0) {
        this.message = 'No row selected';
        return;
      }
      for (const row of selected) {
        await this.applyOn(row);
      }
      this.message = `Applied ON to ${selected.length} row(s)`;
    },
    async applySelectedOff() {
      const selected = this.rows.filter((row) => row.selected);
      if (selected.length === 0) {
        this.message = 'No row selected';
        return;
      }
      for (const row of selected) {
        await this.applyOff(row);
      }
      this.message = `Applied OFF to ${selected.length} row(s)`;
    },
    toggleSelectAll(ev) {
      const checked = !!ev?.target?.checked;
      for (const row of this.rows) {
        row.selected = checked;
      }
    },
    displayVal(v) {
      return v === null || v === undefined ? '-' : `${v}`;
    },
    displayTs(ts) {
      if (!ts) {
        return '-';
      }
      return new Date(ts * 1000).toLocaleString();
    },
    describeError(e) {
      if (e?.response?.data?.detail) {
        return e.response.data.detail;
      }
      if (e?.message) {
        return e.message;
      }
      return 'unknown error';
    },
    schedulePolling() {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      this.timerId = setInterval(() => {
        this.pollTick += 1;
        if (this.pollTick % 3 === 0) {
          this.loadModules();
        }
        this.readStatusAll();
      }, 1000);
    },
  },
  async mounted() {
    await this.loadModules();
    await this.readStatusAll();
    this.schedulePolling();
  },
  beforeUnmount() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  },
};
</script>

<style scoped>
.hv-wrap {
  @apply p-2;
}

.panel {
  @apply bg-white border border-gray-300 rounded p-3;
}

.grid-form {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.label {
  @apply block text-sm font-semibold text-gray-800 mb-1;
}

.inpt {
  @apply w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1.5;
}

.actions-row {
  @apply flex flex-wrap items-center gap-2 mt-3;
}

.status-box {
  @apply mt-3 p-2 bg-teal-50 border border-teal-200 rounded text-sm;
}

.channel-table {
  width: 100%;
  border-collapse: collapse;
}

.channel-table th,
.channel-table td {
  @apply border-b border-gray-200 px-2 py-1 text-left align-middle text-sm;
}

.k {
  @apply font-semibold text-gray-800;
}

.row-badge {
  @apply inline-block text-xs font-bold px-2 py-0.5 rounded-full;
}

.row-badge-ok {
  @apply bg-green-100 text-green-800;
}

.row-badge-ng {
  @apply bg-red-100 text-red-800;
}

.btn {
  @apply font-bold py-1 px-2 rounded text-white;
}

.btn-blue {
  @apply bg-blue-500;
}

.btn-blue:hover {
  @apply bg-blue-700;
}

.btn-gray {
  @apply bg-gray-500;
}

.btn-gray:hover {
  @apply bg-gray-700;
}

.btn-red {
  @apply bg-red-500;
}

.btn-red:hover {
  @apply bg-red-700;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
