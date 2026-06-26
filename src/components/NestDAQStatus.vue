<template>
   <div>
      <div v-if="!fastapi_uri" class="text-red-700">
         API is not registered for part 'nestdaq-status'.
      </div>
      <table>
         <tr>
           <th>device</th><th>status</th>
         </tr>
         <tr v-for="(state,device) in msg" :key="device">
            <td>{{ device }}</td>
            <td>{{ state }}</td>
         </tr>
      </table>
      {{msg}}
   </div>
</template>


<script>
import axios from 'axios'
import { getPartApi } from '@/utilities/ApiRegistry';

export default {
   data() {
      return {
         msg: {"device":"IDLE"},
         fastapi_uri: "",
         api_part_key: "nestdaq-status",
      }
   },
   methods: {
      refreshApiBase() {
         this.fastapi_uri = getPartApi(this.api_part_key);
      },
      update() {
         this.refreshApiBase();
         if (!this.fastapi_uri) {
            setTimeout(() => { this.update(); }, 1000);
            return;
         }
         axios.get(this.fastapi_uri + '/nestdaq/status/')
        .then((response) => {
            //console.log(response.data);
                this.msg = response.data;
            });
            setTimeout(() => { this.update(); }, 1000);
      }
   },
   mounted() {
      this.refreshApiBase();
      this.update()
   }
}
</script>

<style>
div.state {
border: 1px solid blue;
}
</style>