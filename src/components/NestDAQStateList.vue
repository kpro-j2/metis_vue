<template>
   <div class="text-xl font-bold"> NestDAQ Device Status</div>
   <div>
      <table class="border-collapse border border-gray-500">
         <tr>
           <th class="border-collapse border border-gray-500"> Device </th>
           <th class="border-collapse border border-gray-500"> N </th>
           <th class="border-collapse border border-gray-500" v-for="(i,val) in nestdaq_state_list_short" :key="i">
              {{ nestdaq_state_list_short[val] }}
           </th>
         </tr>
         <tr v-for="(i,device) in nestdaq_device_list" :key="i">
            <td class="border-collapse border border-gray-500"> {{device}} </td>
            <td class="border-collapse border border-gray-500"> {{nestdaq_device_list[device]}}</td>
            <td class="border-collapse border border-gray-500" v-for="(i,val) in nestdaq_state_list_short" :key="i">
               {{nestdaq_device_state_list[device][val]}}
            </td>
         </tr>
      </table>
   </div>
   <div>&nbsp;</div>
</template>

<script>
import axios from 'axios'
import { getPartApi } from '@/utilities/ApiRegistry';
export default {
   props: {
      apiBase: {
         type: String,
         default: "",
      },
   },
   data() {
      return {
         fastapi_uri: "",
         api_part_key: "nestdaq-state-list",
         nestdaq_status_msg: {"device":"IDLE"},
         nestdaq_device_list: {},
         nestdaq_device_state_list: {},
         nestdaq_state_list_short: {
            "UNDEFINED"            : "Undef",
            "OK"                   : "OK",
            "ERROR"                : "Err",
            "IDLE"                 : "Idl",
            "INITIALIZING DEVICE"  : "Ini-Dev",
            "INITIALIZED"          : "Ini",
            "BINDING"              : "Bind",
            "BOUND"                : "Bound",
            "CONNECTING"           : "Conn",
            "DEVICE READY"         : "Dev-Rdy",
            "INITIALIZING TASK"    : "Ini-Tsk",
            "READY"                : "Rdy",
            "RUNNING"              : "Running",
            "RESETTING TASK"       : "Rst-Tsk",
            "RESETTING DEVICE"     : "Rst-Dev",
            "EXITING"              : "Exit"
         }
      }
   },
   methods: {
      refreshApiBase() {
         this.fastapi_uri = this.apiBase || getPartApi(this.api_part_key);
      },
      update() {
         this.refreshApiBase();
         if (!this.fastapi_uri) {
            setTimeout(() => { this.update(); }, 1000);
            return;
         }
         this.make_state_list();  
         setTimeout(() => { this.update(); }, 1000);
      },
      make_state_list(){
         axios.get(this.fastapi_uri+'/nestdaq/status/')
         .then((response) => {
            this.nestdaq_status_msg = response.data;
            this.nestdaq_device_list = {};
            this.nestdaq_device_state_list = {};
            for (let ins_name in this.nestdaq_status_msg) {
               let device_name = ins_name.split('-')[0];	       
               if (this.nestdaq_device_list[device_name]) {
                  this.nestdaq_device_list[device_name] += 1;
               }else{
                  this.nestdaq_device_list[device_name] = 1;
                  this.nestdaq_device_state_list[device_name] = {};
               }
               if (this.nestdaq_device_state_list[device_name][this.nestdaq_status_msg[ins_name]]) {
                  this.nestdaq_device_state_list[device_name][this.nestdaq_status_msg[ins_name]] += 1;
               }else{
                  this.nestdaq_device_state_list[device_name][this.nestdaq_status_msg[ins_name]] = 1;
               }
            }
         }).catch((error)=>{console.log(error.data);});
      }
   },
   mounted() {
      this.refreshApiBase();
      this.update()
   }
}
</script>
