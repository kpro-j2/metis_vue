<template>
   <LocalTimestamp></LocalTimestamp>

   <h1>Metis</h1>
   <div>
      <ul class="tabs-menu">
         <li
            v-for="tab in visibleTabs"
            :key="tab.name"
            :class="{ active: currentTab === tab.name }"
            @click="currentTab = tab.name"
         >{{ tab.label }}</li>
      </ul>
      <div class="tabs-content">
         <keep-alive>
            <component :is="currentTab" v-bind="currentProps"></component>
         </keep-alive>
      </div>
      <div v-if="visibleTabs.length === 1 && visibleTabs[0].name === 'ConfigPanel'" class="setup-hint">
         API 設定が未完了です。Config タブで API を登録し、疎通できると各タブが表示されます。
      </div>
   </div>
</template>
<script>
import axios from 'axios';
import NestDAQController from './components/NestDAQController.vue'
import TabExample from './examples/TabExample.vue'
import RunStatusSummary from './components/RunStatusSummary.vue'
import LocalTimestamp from './components/LocalTimestamp.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import HvDashboard from './components/HvDashboard.vue'
import { getPartApi, getScalerIps } from '@/utilities/ApiRegistry';

export default {
   data () {
      return {
         currentTab: 'ConfigPanel',
         visibleTabs: [
            { name: 'ConfigPanel', label: 'UI Setting' }
         ],
         refreshTimerId: null,
      }
   },
   computed: {
      currentProps() {
         const nestdaqApi = getPartApi('nestdaq-controller');
         const scalerApi = getPartApi('scaler-monitor');
         const hvApi = getPartApi('hv-monitor');
         const propsByTab = {
            RunStatusSummary: {},
            NestDAQController: { apiBase: nestdaqApi },
            TabExample: { apiBase: scalerApi },
            HvDashboard: { apiBase: hvApi },
            ConfigPanel: {},
         };
         return propsByTab[this.currentTab] || {};
      }
   },
   components: {
      NestDAQController,
      TabExample,
      RunStatusSummary,
      LocalTimestamp,
      ConfigPanel,
      HvDashboard,
   },
   methods: {
      async checkApiReady(partKey, healthPath) {
         const base = getPartApi(partKey);
         if (!base) {
            return false;
         }
         const url = `${base.replace(/\/$/, '')}${healthPath}`;
         try {
            await axios.get(url, { timeout: 1500 });
            return true;
         } catch (_e) {
            return false;
         }
      },
      async refreshVisibleTabs() {
         const [nestdaqReady, scalerReady, hvReady] = await Promise.all([
            this.checkApiReady('nestdaq-controller', '/nestdaq/'),
            this.checkApiReady('scaler-monitor', '/scaler/read/info/all/'),
            this.checkApiReady('hv-monitor', '/rph032/config/list'),
         ]);
         const scalerIpsReady = getScalerIps().length > 0;

         const nextTabs = [];
         if (nestdaqReady || (scalerReady && scalerIpsReady) || hvReady) {
            nextTabs.push({ name: 'RunStatusSummary', label: 'Overview' });
         }
         if (nestdaqReady) {
            nextTabs.push({ name: 'NestDAQController', label: 'NestDAQ' });
         }
         if (scalerReady && scalerIpsReady) {
            nextTabs.push({ name: 'TabExample', label: 'Scaler' });
         }
         if (hvReady) {
            nextTabs.push({ name: 'HvDashboard', label: 'HV' });
         }
         nextTabs.push({ name: 'ConfigPanel', label: 'UI Setting' });

         this.visibleTabs = nextTabs;
         const names = this.visibleTabs.map((t) => t.name);
         if (!names.includes(this.currentTab)) {
            this.currentTab = this.visibleTabs[0].name;
         }
      }
   },
   mounted () {
      this.refreshVisibleTabs();
      this.refreshTimerId = setInterval(() => {
         this.refreshVisibleTabs();
      }, 3000);
   },
   beforeUnmount() {
      if (this.refreshTimerId) {
         clearInterval(this.refreshTimerId);
      }
   }
}
</script>

<style scoped>


/* ulのデフォルトスタイルを消去 */
.tabs-menu {
  margin: 0;
  padding: 0;
  list-style-type: none;
   display: flex;
   flex-wrap: wrap;
}

/* タブの基本スタイル */
.tabs-menu li {
  display: block;
  margin-right: 8px;
  margin-bottom: -1px;
  padding: 10px 20px;
  border-style: solid;
  border-width: 1px;
  border-color: transparent;
  border-radius: 4px 4px 0 0;
  @apply text-teal-600;
  text-decoration: none;
}

/* タブにマウスを乗せたらカーソルの形を変える */
.tabs-menu li:hover {
  cursor: pointer;
}

/* 非選択のタブにマウスを乗せたら色を変える */
.tabs-menu li:not(.active):hover {
  border-color: #f0f0f0 #f0f0f0 #999;
  background-color: #f0f0f0;
}

/* 選択中のタブ */
.tabs-menu .active {
  border-color: #999 #999 transparent #841a1a;
  @apply bg-teal-50;
  color: black;
}

/* タブコンテンツ表示エリア */
.tabs-content {
  clear: both;
  background-color: #f0fbff;
  @apply bg-teal-50;
  border: 1px solid #999;
  border-radius: 0 4px 4px 4px;
  padding: 10px 10px 30px 10px;
}

.setup-hint {
   margin-top: 12px;
   color: #9f1239;
   font-weight: 600;
}
</style>