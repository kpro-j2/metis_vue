<template>
  <div class="panel">
    <h2 class="title">UI Settings</h2>
    <p class="caption">必要な情報をセクションごとに設定します。</p>

    <div class="accordion box">
      <button class="accordion-head" @click="toggleSection('nestdaq')">
        <span class="head-title">NestDAQ Controller</span>
        <span class="badge" :class="badgeClass('nestdaq')">{{ badgeLabel('nestdaq') }}</span>
      </button>
      <div v-if="activeSection === 'nestdaq'" class="accordion-body">
        <div class="form-grid">
          <div>
            <label class="label">API URI</label>
            <input v-model.trim="nestdaqApiUri" class="inpt" type="text" placeholder="http://api-host:8000">
          </div>
        </div>
        <div class="row actions">
          <button class="btn btn-blue" @click="saveNestdaqConfig">Save NestDAQ API</button>
          <button class="btn btn-gray" @click="refreshStatuses">Refresh Status</button>
        </div>

        <div v-if="cardStatus.nestdaq === 'ok'" class="box inner-box">
          <h3 class="subtitle">Redis Configuration</h3>
          <div class="form-grid">
            <div>
              <label class="label" for="redis-host">Host</label>
              <input id="redis-host" v-model.trim="redisForm.host" class="inpt" type="text" placeholder="localhost" @focus="redisFormEditing = true" @blur="redisFormEditing = false">
            </div>
            <div>
              <label class="label" for="redis-port">Port</label>
              <input id="redis-port" v-model.number="redisForm.port" class="inpt" type="number" min="1" max="65535" placeholder="6379" @focus="redisFormEditing = true" @blur="redisFormEditing = false">
            </div>
            <div>
              <label class="label" for="redis-db">DB</label>
              <input id="redis-db" v-model.number="redisForm.db" class="inpt" type="number" min="0" placeholder="0" @focus="redisFormEditing = true" @blur="redisFormEditing = false">
            </div>
          </div>
          <div class="row actions">
            <button class="btn btn-blue" @click="saveRedisConfig">Save Redis Config</button>
            <button class="btn btn-gray" @click="refreshRedisStatus">Refresh Status</button>
          </div>
          <div v-if="redisError" class="error-msg">{{ redisError }}</div>
          <div v-if="redisReady" class="ok-msg">Redis connected ✓</div>
        </div>
      </div>
    </div>

    <div class="accordion box">
      <button class="accordion-head" @click="toggleSection('scaler')">
        <span class="head-title">Scaler Monitor</span>
        <span class="badge" :class="badgeClass('scaler')">{{ badgeLabel('scaler') }}</span>
      </button>
      <div v-if="activeSection === 'scaler'" class="accordion-body">
        <div class="form-grid">
          <div>
            <label class="label">API URI</label>
            <input v-model.trim="scalerApiUri" class="inpt" type="text" placeholder="http://api-host:8000">
          </div>
          <div>
            <label class="label">Scaler IP List (1行1IP)</label>
            <textarea v-model="scalerIpText" class="inpt text-area" placeholder="192.168.2.160\n192.168.2.161"></textarea>
          </div>
        </div>
        <div class="row actions">
          <button class="btn btn-blue" @click="saveScalerConfig">Save Scaler Config</button>
          <button class="btn btn-gray" @click="refreshStatuses">Refresh Status</button>
        </div>
      </div>
    </div>

    <div class="accordion box">
      <button class="accordion-head" @click="toggleSection('hv')">
        <span class="head-title">HV Monitor</span>
        <span class="badge" :class="badgeClass('hv')">{{ badgeLabel('hv') }}</span>
      </button>
      <div v-if="activeSection === 'hv'" class="accordion-body">
        <div class="form-grid">
          <div>
            <label class="label">API URI</label>
            <input v-model.trim="hvApiUri" class="inpt" type="text" placeholder="http://api-host:8000">
          </div>
        </div>
        <div class="row actions">
          <button class="btn btn-blue" @click="saveHvApi">Save HV API</button>
          <button class="btn btn-gray" @click="refreshStatuses">Refresh Status</button>
        </div>

        <div v-if="cardStatus.hv !== 'ok'" class="caption">
          HV の詳細設定を表示するには、HV API の登録と疎通成功が必要です。
        </div>

        <div v-if="cardStatus.hv === 'ok'" class="box inner-box">
          <h3 class="subtitle">Server Profile Editor</h3>
          <div class="form-grid">
            <div>
              <label class="label" for="server-id">Server ID</label>
              <input id="server-id" v-model.trim="serverForm.server_id" class="inpt" type="text" placeholder="daq-a">
            </div>
            <div>
              <label class="label" for="server-uri">API Base URI</label>
              <input id="server-uri" v-model.trim="serverForm.api_base_uri" class="inpt" type="text" placeholder="http://daq-a:8000">
            </div>
          </div>
          <div class="row actions">
            <button class="btn btn-blue" @click="saveServer">Save Server</button>
            <button class="btn btn-gray" @click="resetServerForm">Clear Server Form</button>
          </div>
          <table class="table mt-2">
            <thead>
              <tr>
                <th>Server ID</th>
                <th>API Base URI</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in servers" :key="item.server_id">
                <td>{{ item.server_id }}</td>
                <td>{{ item.api_base_uri || '-' }}</td>
                <td>
                  <button class="btn btn-gray" @click="editServer(item)">Edit</button>
                  <button class="btn btn-red" :disabled="item.server_id === 'default'" @click="deleteServer(item.server_id)">Delete</button>
                </td>
              </tr>
              <tr v-if="servers.length === 0">
                <td colspan="3" class="empty">No server profile</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="cardStatus.hv === 'ok'" class="box inner-box">
          <h3 class="subtitle">HV Module Editor</h3>
          <div class="form-grid">
            <div>
              <label class="label" for="module">Module</label>
              <input id="module" v-model.trim="form.module" class="inpt" type="text" placeholder="hv1">
            </div>
            <div>
              <label class="label" for="module-server">Server ID</label>
              <input id="module-server" list="server-list" v-model.trim="form.server_id" class="inpt" type="text" placeholder="default">
              <datalist id="server-list">
                <option v-for="item in servers" :key="item.server_id" :value="item.server_id">{{ item.server_id }}</option>
              </datalist>
            </div>
            <div>
              <label class="label" for="ip">IP Address</label>
              <input id="ip" v-model.trim="form.ip" class="inpt" type="text" placeholder="192.168.10.16">
            </div>
            <div>
              <label class="label" for="port">Port</label>
              <input id="port" v-model.number="form.port" class="inpt" type="number" min="1" max="65535" placeholder="4660">
            </div>
          </div>
          <div class="row actions">
            <button class="btn btn-blue" @click="saveModule">Save Module</button>
            <button class="btn btn-gray" @click="resetForm">Clear Form</button>
          </div>

          <h3 class="subtitle mt">Registered Modules</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Server</th>
                <th>API URI</th>
                <th>IP</th>
                <th>Port</th>
                <th>Last Read</th>
                <th>Error</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in modules" :key="item.module">
                <td>{{ item.module }}</td>
                <td>{{ item.server_id || 'default' }}</td>
                <td>{{ item.api_base_uri || '-' }}</td>
                <td>{{ item.ip }}</td>
                <td>{{ item.port }}</td>
                <td>{{ formatTimestamp(item.timestamp) }}</td>
                <td>{{ item.error || '-' }}</td>
                <td>
                  <button class="btn btn-gray" @click="editModule(item)">Edit</button>
                  <button class="btn btn-red" @click="deleteModule(item.module)">Delete</button>
                </td>
              </tr>
              <tr v-if="modules.length === 0">
                <td colspan="8" class="empty">No module registered</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <p class="msg" :class="messageType">{{ message }}</p>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import axios from 'axios';
import { getPartApi, getScalerIps, setScalerIps, setPartApi } from '@/utilities/ApiRegistry';

const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_DB = 0;

export default defineComponent({
  name: 'ConfigPanel',
  data() {
    return {
      activeSection: 'nestdaq',
      nestdaqApiUri: getPartApi('nestdaq-controller'),
      scalerApiUri: getPartApi('scaler-monitor'),
      hvApiUri: getPartApi('hv-monitor'),
      scalerIpText: getScalerIps().join('\n'),
      redisForm: {
        host: 'localhost',
        port: DEFAULT_REDIS_PORT,
        db: DEFAULT_REDIS_DB,
      },
      redisFormEditing: false,
      redisReady: false,
      redisError: '',
      modules: [],
      servers: [],
      form: {
        module: '',
        server_id: 'default',
        ip: '',
        port: 4660,
      },
      serverForm: {
        server_id: '',
        api_base_uri: '',
      },
      cardStatus: {
        nestdaq: 'unregistered',
        scaler: 'unregistered',
        hv: 'unregistered',
      },
      message: '',
      messageType: 'info',
    };
  },
  methods: {
    toggleSection(section) {
      this.activeSection = this.activeSection === section ? '' : section;
    },
    setMessage(text, type = 'info') {
      this.message = text;
      this.messageType = type;
    },
    badgeLabel(section) {
      const s = this.cardStatus[section];
      if (s === 'ok') {
        return 'Ready';
      }
      if (s === 'partial') {
        return 'Incomplete';
      }
      if (s === 'ng') {
        return 'Unreachable';
      }
      return 'Not Set';
    },
    badgeClass(section) {
      const s = this.cardStatus[section];
      if (s === 'ok') {
        return 'badge-ok';
      }
      if (s === 'partial') {
        return 'badge-partial';
      }
      if (s === 'ng') {
        return 'badge-ng';
      }
      return 'badge-unset';
    },
    formatTimestamp(ts) {
      if (!ts) {
        return '-';
      }
      return new Date(ts * 1000).toLocaleString();
    },
    parseScalerIpList() {
      return this.scalerIpText
        .split(/\n|,/)
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    },
    async checkReachable(base, path) {
      if (!base) {
        return false;
      }
      try {
        await axios.get(`${String(base).replace(/\/$/, '')}${path}`, { timeout: 1500 });
        return true;
      } catch (_e) {
        return false;
      }
    },
    async refreshStatuses() {
      this.nestdaqApiUri = getPartApi('nestdaq-controller');
      this.scalerApiUri = getPartApi('scaler-monitor');
      this.hvApiUri = getPartApi('hv-monitor');

      const [nestOk, scalerOk, hvOk] = await Promise.all([
        this.checkReachable(this.nestdaqApiUri, '/nestdaq/'),
        this.checkReachable(this.scalerApiUri, '/scaler/read/info/all/'),
        this.checkReachable(this.hvApiUri, '/rph032/config/list'),
      ]);

      await this.refreshRedisStatus();

      const scalerIps = getScalerIps();
      this.cardStatus.nestdaq = this.nestdaqApiUri ? (nestOk ? 'ok' : 'ng') : 'unregistered';
      if (!this.scalerApiUri) {
        this.cardStatus.scaler = 'unregistered';
      } else if (!scalerOk) {
        this.cardStatus.scaler = 'ng';
      } else if (scalerIps.length === 0) {
        this.cardStatus.scaler = 'partial';
      } else {
        this.cardStatus.scaler = 'ok';
      }
      this.cardStatus.hv = this.hvApiUri ? (hvOk ? 'ok' : 'ng') : 'unregistered';

      if (this.cardStatus.hv === 'ok') {
        await Promise.all([this.loadServers(), this.loadModules()]);
      } else {
        this.servers = [];
        this.modules = [];
      }
    },
    saveNestdaqConfig() {
      if (!this.nestdaqApiUri) {
        this.setMessage('nestdaq api uri is required', 'error');
        return;
      }
      setPartApi('nestdaq-controller', this.nestdaqApiUri);
      this.refreshStatuses();
      this.setMessage('saved nestdaq api', 'ok');
    },
    saveScalerConfig() {
      if (!this.scalerApiUri) {
        this.setMessage('scaler api uri is required', 'error');
        return;
      }
      setPartApi('scaler-monitor', this.scalerApiUri);
      setScalerIps(this.parseScalerIpList());
      this.refreshStatuses();
      this.setMessage('saved scaler config', 'ok');
    },
    saveHvApi() {
      if (!this.hvApiUri) {
        this.setMessage('hv api uri is required', 'error');
        return;
      }
      setPartApi('hv-monitor', this.hvApiUri);
      this.refreshStatuses();
      this.setMessage('saved hv api', 'ok');
    },
    async refreshRedisStatus() {
      if (!this.nestdaqApiUri) {
        this.redisReady = false;
        return;
      }
      try {
        const response = await axios.get(`${this.nestdaqApiUri}/redis/status`);
        const data = response.data || {};
        this.redisReady = !!data.connected;
        if (!this.redisFormEditing) {
          this.redisForm.host = data.host || this.redisForm.host;
          this.redisForm.port = Number.isInteger(data.port) ? data.port : this.redisForm.port;
          this.redisForm.db = Number.isInteger(data.db) ? data.db : this.redisForm.db;
        }
        this.redisError = this.redisReady ? '' : 'Redis is not connected';
      } catch (e) {
        this.redisReady = false;
        this.redisError = this.describeError(e);
      }
    },
    async saveRedisConfig() {
      if (!this.nestdaqApiUri) {
        this.setMessage('nestdaq api is not set', 'error');
        return;
      }
      this.redisFormEditing = false;
      try {
        const url = `${this.nestdaqApiUri}/redis/config/set/${encodeURIComponent(this.redisForm.host)}/${this.redisForm.port}/${this.redisForm.db}`;
        const response = await axios.get(url);
        const data = response.data || {};
        this.redisReady = !!data.connected;
        this.redisError = this.redisReady ? '' : 'Failed to connect Redis';
        if (this.redisReady) {
          this.setMessage('saved redis config', 'ok');
        }
      } catch (e) {
        this.redisReady = false;
        this.redisError = this.describeError(e);
        this.setMessage(`failed to save redis config: ${this.describeError(e)}`, 'error');
      }
    },
    endpoint(path) {
      const base = getPartApi('hv-monitor') || '';
      if (!base) {
        return '';
      }
      return `${String(base).replace(/\/$/, '')}${path}`;
    },
    describeError(e) {
      if (e?.response?.data?.detail) {
        return e.response.data.detail;
      }
      if (e?.message === 'Network Error') {
        return 'Network Error (API unreachable or blocked by CORS).';
      }
      return e?.message || 'unknown error';
    },
    async loadServers() {
      const url = this.endpoint('/rph032/server/list');
      if (!url) {
        this.servers = [];
        return;
      }
      try {
        const response = await axios.get(url);
        this.servers = response.data.servers || [];
      } catch (e) {
        this.setMessage(`failed to load servers: ${this.describeError(e)}`, 'error');
      }
    },
    editServer(item) {
      this.serverForm.server_id = item.server_id;
      this.serverForm.api_base_uri = item.api_base_uri || '';
    },
    resetServerForm() {
      this.serverForm.server_id = '';
      this.serverForm.api_base_uri = '';
    },
    async saveServer() {
      if (!this.serverForm.server_id || !this.serverForm.api_base_uri) {
        this.setMessage('server id and api base uri are required', 'error');
        return;
      }
      const path = `/rph032/server/set/${encodeURIComponent(this.serverForm.server_id)}/${encodeURIComponent(this.serverForm.api_base_uri)}`;
      const url = this.endpoint(path);
      if (!url) {
        this.setMessage('hv-monitor api is not set', 'error');
        return;
      }
      try {
        await axios.get(url);
        this.setMessage(`saved server: ${this.serverForm.server_id}`, 'ok');
        await this.loadServers();
      } catch (e) {
        this.setMessage(`failed to save server: ${this.describeError(e)}`, 'error');
      }
    },
    async deleteServer(serverId) {
      const path = `/rph032/server/clear/${encodeURIComponent(serverId)}`;
      const url = this.endpoint(path);
      if (!url) {
        this.setMessage('hv-monitor api is not set', 'error');
        return;
      }
      try {
        await axios.get(url);
        this.setMessage(`deleted server: ${serverId}`, 'ok');
        if (this.serverForm.server_id === serverId) {
          this.resetServerForm();
        }
        if (this.form.server_id === serverId) {
          this.form.server_id = 'default';
        }
        await this.refreshStatuses();
      } catch (e) {
        this.setMessage(`failed to delete server: ${this.describeError(e)}`, 'error');
      }
    },
    async loadModules() {
      const url = this.endpoint('/rph032/config/list');
      if (!url) {
        this.modules = [];
        return;
      }
      try {
        const response = await axios.get(url);
        this.modules = response.data.modules || [];
      } catch (e) {
        this.setMessage(`failed to load modules: ${this.describeError(e)}`, 'error');
      }
    },
    editModule(item) {
      this.form.module = item.module;
      this.form.server_id = item.server_id || 'default';
      this.form.ip = item.ip;
      this.form.port = item.port;
    },
    resetForm() {
      this.form.module = '';
      this.form.server_id = 'default';
      this.form.ip = '';
      this.form.port = 4660;
    },
    validateForm() {
      if (!this.form.module || !this.form.server_id || !this.form.ip) {
        return false;
      }
      return Number.isInteger(this.form.port) && this.form.port >= 1 && this.form.port <= 65535;
    },
    async saveModule() {
      if (!this.validateForm()) {
        this.setMessage('module/server/ip/port are required', 'error');
        return;
      }
      const path = `/rph032/config/set/${encodeURIComponent(this.form.module)}/server/${encodeURIComponent(this.form.server_id)}/${encodeURIComponent(this.form.ip)}/${this.form.port}`;
      const url = this.endpoint(path);
      if (!url) {
        this.setMessage('hv-monitor api is not set', 'error');
        return;
      }
      try {
        await axios.get(url);
        this.setMessage(`saved module: ${this.form.module}`, 'ok');
        await this.loadModules();
      } catch (e) {
        this.setMessage(`failed to save module: ${this.describeError(e)}`, 'error');
      }
    },
    async deleteModule(moduleName) {
      const path = `/rph032/config/clear/${encodeURIComponent(moduleName)}`;
      const url = this.endpoint(path);
      if (!url) {
        this.setMessage('hv-monitor api is not set', 'error');
        return;
      }
      try {
        await axios.get(url);
        this.setMessage(`deleted module: ${moduleName}`, 'ok');
        if (this.form.module === moduleName) {
          this.resetForm();
        }
        await this.loadModules();
      } catch (e) {
        this.setMessage(`failed to delete module: ${this.describeError(e)}`, 'error');
      }
    },
  },
  mounted() {
    this.refreshStatuses();
  },
});
</script>

<style scoped>
.panel {
  @apply p-2;
}

.title {
  @apply text-xl font-bold text-teal-900;
}

.caption {
  @apply text-sm text-gray-700 mb-3;
}

.subtitle {
  @apply text-lg font-semibold text-teal-900 mb-2;
}

.box {
  @apply bg-white border border-gray-300 rounded p-3 mb-4;
}

.inner-box {
  @apply mt-3;
}

.accordion {
  @apply bg-teal-50;
}

.accordion-head {
  @apply w-full flex items-center justify-between text-left p-2 rounded bg-white border border-teal-200;
}

.accordion-body {
  @apply mt-3;
}

.head-title {
  @apply font-bold text-teal-900;
}

.badge {
  @apply text-xs font-semibold px-2 py-0.5 rounded-full;
}

.badge-ok {
  @apply bg-green-100 text-green-800;
}

.badge-partial {
  @apply bg-amber-100 text-amber-800;
}

.badge-ng {
  @apply bg-red-100 text-red-800;
}

.badge-unset {
  @apply bg-gray-200 text-gray-700;
}

.row {
  @apply flex items-center gap-2 mb-2;
}

.actions {
  @apply mt-2;
}

.form-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.label {
  @apply block text-sm font-semibold text-gray-800 mb-1;
}

.inpt {
  @apply w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1.5;
}

.text-area {
  min-height: 120px;
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

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  @apply border-b border-gray-200 px-2 py-1 text-left align-top text-sm;
}

.empty {
  @apply text-gray-500;
}

.msg {
  @apply text-sm mt-2;
}

.info {
  @apply text-gray-700;
}

.ok {
  @apply text-green-700;
}

.error {
  @apply text-red-700;
}

.mt {
  margin-top: 1rem;
}

.error-msg {
  @apply text-red-700 text-sm mt-1;
}

.ok-msg {
  @apply text-green-700 text-sm mt-1;
}
</style>
