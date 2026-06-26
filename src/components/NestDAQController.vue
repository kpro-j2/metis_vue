<template>
   <h2 class="text-xl font-bold"> NestDAQ Run Controller </h2>
   <div v-if="!fastapi_uri" class="text-red-700">
      API is not registered for part 'nestdaq-controller'. Please register it in Config.
   </div>
   <div v-if="fastapi_uri && !redis_ready" class="warn-box">
      <div class="text-l font-bold">Redis registration is required</div>
      <p class="caption">Please configure Redis host/port/db in UI Setting (NestDAQ section).</p>
   </div>
   <table>
   <tr><td> DAQ status: </td><td> <span class="text-4xl"> {{daq_state}} </span></td></tr>
   <tr v-if="daq_state=='RUNNING'">
       <td> Current run number (read): </td><td><span class="text-4xl">{{key_val_read['run_info:run_number']}}</span></td>
   </tr><tr v-else>
       <td> Next run number (read): </td><td><span class="text-4xl"> {{key_val_read['run_info:run_number']}}</span></td>
   </tr>
   <tr><td> Latest run number (read):</td><td> {{key_val_read['run_info:latest_run_number']}} </td></tr>
   <tr><td>
      Next run number (set):</td>
      <td><input size="5" class="inpt" type="text" v-model="key_val_set['run_info:run_number']"> <span></span>
      <span v-if="(daq_state=='IDLE'||daq_state=='NO PROCESS')&&daq_controllable==true">
         <button  class="btn btn-blue" @click="key_set('run_info:run_number')"> Set </button> <span></span>
      </span><span v-else>
         <button  class="btn btn-blue-disabled"> Set </button> <span></span>
      </span>
      <button  class="btn btn-blue" @click="key_clear('run_info:run_number_set')"> Clear </button>
   </td>
   </tr>
   <tr><td> Run comment (read): </td><td>{{key_val_read['run_info:run_comment']}} </td></tr>
   <tr><td>
      Run comment (set): </td>
      <td><input size="75" class="inpt" type="text" v-model="key_val_set['run_info:run_comment']"> <span></span>
      <span v-if="(daq_state=='IDLE'||daq_state=='NO PROCESS')&&daq_controllable==true">
         <button  class="btn btn-blue" @click="key_set('run_info:run_comment')"> Set </button> <span></span>
      </span><span v-else>
         <button  class="btn btn-blue-disabled"> Set </button> <span></span>
      </span>
      <button  class="btn btn-blue" @click="key_clear('run_info:run_comment')"> Clear </button>
   </td></tr>
   <tr><td> Current time: </td><td> <span class="text-3xl"> {{daq_current_time}} </span></td></tr>
   <tr><td> Start time: </td><td> <span class="text-3xl"> {{daq_start_time}}  </span></td></tr>
   <tr><td> Stop time:  </td><td> <span class="text-3xl"> {{daq_stop_time}}   </span></td></tr>
   <tr>
      <td> Auto run change: </td>
      <td>
      <span v-if="key_val_read['run_info:auto_run_change_mode'] == 'enabled'">Enabled, Elapsed time: {{run_elapsed_time}} sec / Duration: {{key_val_read['run_info:auto_run_change_dur']}} sec</span>
      <span v-else> Disabled</span>
      </td>
   </tr>
   </table>
   <div>
      <span v-if="daq_state=='IDLE'&&daq_controllable==true">
         <button class="btn btn-blue" @click='state_change(["PRE START","CONNECT","INIT TASK","RUN","POST START"])'> Start </button> <span></span>
      </span><span v-else>
         <button class="btn btn-blue-disabled"> Start </button> <span></span>
      </span>
      <span v-if="daq_state=='RUNNING'&&daq_controllable==true">
         <button class="btn btn-blue" @click='state_change(["PRE STOP", "STOP","RESET TASK","RESET DEVICE", "POST STOP"])'> Stop </button> <span></span>
      </span><span v-else>
         <button class="btn btn-blue-disabled"> Stop </button> <span></span>
      </span>
   </div>
   <div>&nbsp;</div>
   <div>
      <span class="text-xl font-bold"> Expert mode</span> <span></span>
      <span><input type="checkbox" v-model="expert_mode_enabled">: </span>
      <span v-if="expert_mode_enabled == true">Enabled</span>
      <span v-else> Disabled</span>
   </div>
   <div v-if="expert_mode_enabled == true">
      <div>&nbsp;</div>
      <div class="text-l font-bold"> Expert's controller</div>
      <table style="text-align: center">
         <tr>
            <td> Idle ⊳ </td>
            <td> <button class="w-24 btn btn-gray" @click='state_change(["PRE START"])'> Pre start </button> </td>
            <td> ⊳ Idle ⊳ </td>
            <td>
               <span v-if="daq_state=='IDLE'&&daq_controllable==true">
                  <button class="w-24 btn btn-gray" @click='state_change(["CONNECT"])'> Connect </button> <span></span>
               </span><span v-else>
                  <button class="w-24 btn btn-gray-disabled"> Connect </button> <span></span>    
               </span>
            </td>
            <td>  ⊳ Device Ready ⊳ </td>
            <td>
               <span v-if="daq_state=='DEVICE READY'&&daq_controllable==true">
                  <button class="w-24 btn btn-gray" @click='state_change(["INIT TASK"])'> Init task </button> <span></span>
               </span><span v-else>
                  <button class="w-24 btn btn-gray-disabled"> Init task </button> <span></span>
               </span>
            </td>
            <td> ⊳ Ready ⊳ </td>
            <td>
               <span v-if="daq_state=='READY'&&daq_controllable==true">
                  <button class="w-24 btn btn-gray" @click='state_change(["RUN"])'> Run </button>
               </span><span v-else>
                  <button class="w-24 btn btn-gray-disabled"> Run </button>
               </span>
            </td>
            <td> ⊳ Running ⊳ </td>
            <td> <button class="w-24 btn btn-gray" @click='state_change(["POST START"])'> Post start </button> </td>
            <td> ⊳ Running </td>
         </tr>
         <tr>
            <td> Idle ⊲ </td>
            <td> <button class="w-24 btn btn-gray" @click='state_change(["POST STOP"])'> Post stop </button> </td>
            <td> ⊲ Idle ⊲ </td>
            <td>
               <span v-if="daq_state=='DEVICE READY'&&daq_controllable==true">
                  <button class="w-24 btn btn-gray" @click='state_change(["RESET DEVICE"])'> Rst dev </button> <span></span>
               </span><span v-else>
                  <button class="w-24 btn btn-gray-disabled"> Rst dev </button> <span></span>
               </span>
            </td>
            <td> ⊲ Device Ready ⊲ </td>
            <td>
               <span v-if="daq_state=='READY'&&daq_controllable==true">
                  <button class="w-24 btn btn-gray" @click='state_change(["RESET TASK"])'> Rst task </button> <span></span>
               </span><span v-else>
                  <button class="w-24 btn btn-gray-disabled">Rst task</button> <span></span>
               </span>
            </td>
            <td> ⊲ Ready ⊲ </td>
            <td>
               <span v-if="daq_state=='RUNNING'&&daq_controllable==true">
                  <button class="w-24 btn btn-gray" @click='state_change(["STOP"])'> Stop </button>
               </span><span v-else>
                  <button class="w-24 btn btn-gray-disabled"> Stop </button>
               </span>
            </td>
            <td> ⊲ Running ⊲ </td>
            <td> <button class="w-24 btn btn-gray" @click='state_change(["PRE STOP"])'> Pre stop </button> </td>
            <td> ⊲ Running </td>
         </tr>
      </table>
      <div>
         Any state ⊳ 
         <button class="btn btn-gray" @click='state_change(["END"])'> End devices </button>
          ⊳ Exitting
      </div>
      <div> State change start UNIX time: {{state_change_start_time_in_sec}}, Elapsed time: {{state_change_elapsed_time_in_sec}} sec / Timeout: {{state_change_timeout_in_sec}} sec</div>
      <div>
         DAQ error status:
         <span v-if="key_val_read['run_info:daq_error_status'] == ''"> None
            <button class="btn btn-gray-disabled"> Reset Error Status </button>
         </span>
         <span v-else>
            {{key_val_read['run_info:daq_error_status']}}
            <button class="btn btn-gray" @click='reset_daq_error_status()'> Reset Error Status </button>
         </span>
      </div>
      <div> DAQ controllable: {{daq_controllable}}</div>
      <div>&nbsp;</div>
      <div>
         <span class="text-l font-bold"> Auto run change:
         <span v-if="key_val_read['run_info:auto_run_change_mode'] == 'enabled'">Enabled</span>
         <span v-else> Disabled</span>
         </span>
      </div>
      <div v-if="browser_tab_id == key_val_read['run_info:auto_run_change_ctl_holder']">
         <span v-if="key_val_read['run_info:auto_run_change_mode'] == 'enabled'">
            <button  class="btn btn-gray-disabled"> Enable </button> <span></span>
            <button  class="btn btn-gray" @click="auto_run_change_disable()"> Disable </button> <span></span>             
         </span>
         <span v-else>
            <button  class="btn btn-gray" @click="auto_run_change_enable()"> Enable </button> <span></span>
            <button  class="btn btn-gray-disabled"> Disable </button> <span></span>
         </span>
         <button  class="btn btn-gray-disabled"> Get Control </button> <span></span>
      </div>
      <div v-else>
         <button  class="btn btn-gray-disabled"> Enable </button> <span></span>
         <button  class="btn btn-gray-disabled"> Disable </button> <span></span>
         <button  class="btn btn-gray" @click="auto_run_change_get_ctl()"> Get Control </button> <span></span>      
      </div>
      <div> Duration in sec (read): {{key_val_read['run_info:auto_run_change_dur']}} </div>
      <div>
         Duration in sec (set): <input size="5" class="inpt" type="text" v-model="key_val_set['run_info:auto_run_change_dur']"> <span></span>
         <button  class="btn btn-gray" @click="key_set('run_info:auto_run_change_dur')"> Set </button> <span></span>
      </div>
      <div v-if="browser_tab_id == key_val_read['run_info:auto_run_change_ctl_holder']"> Now you HAVE control! </div>
      <div v-else> Now you do NOT have control...</div>
      <div> Tab ID of this tab: {{browser_tab_id}} </div>
      <div> Tab ID of control holder: {{key_val_read['run_info:auto_run_change_ctl_holder']}} </div>
      <div> Run start UNIX time {{key_val_read['run_info:run_start_unix_time']}}, Elapsed time: {{run_elapsed_time}} sec / Duration : {{key_val_read['run_info:auto_run_change_dur']}} sec</div>
      <div>&nbsp;</div>
      <div class="text-l font-bold"> Hook scripts</div>
      <table>
         <tr><td style="vertical-align: top"> Pre-start script return: </td><td>
            <pre class="text-xs">{{hook_return['run_info:pre_start_script']}}</pre>
         </td><td></td></tr>
         <tr><td style="vertical-align: top"> Post-start script return: </td><td>
            <pre class="text-xs">{{hook_return['run_info:post_start_script']}}</pre>
         </td><td></td></tr>
         <tr><td style="vertical-align: top"> Pre-stop script return:  </td><td>
            <pre class="text-xs">{{hook_return['run_info:pre_stop_script']}}</pre>
         </td><td></td></tr>
         <tr><td style="vertical-align: top"> Post-stop script return: </td><td>
            <pre class="text-xs">{{hook_return['run_info:post_stop_script']}}</pre>
         </td><td></td></tr>
         <tr><td> &nbsp; </td><td>&nbsp; </td></tr>
         <tr><td> Pre-start scirpt (read): </td><td> {{key_val_read['run_info:pre_start_script']}}  </td>
            <td> <button class="btn btn-gray" @click="exec_hook_script('run_info:pre_start_script')"> Run </button> <span></span> </td></tr>
         <tr><td> Post-start scirpt (read): </td><td> {{key_val_read['run_info:post_start_script']}} </td>
            <td> <button class="btn btn-gray" @click="exec_hook_script('run_info:post_start_script')"> Run </button> <span></span></td></tr>
         <tr><td> Pre-stop scirpt (read):  </td><td> {{key_val_read['run_info:pre_stop_script']}}   </td>
            <td> <button class="btn btn-gray" @click="exec_hook_script('run_info:pre_stop_script')"> Run </button> <span></span></td></tr>
         <tr><td> Post-stop scirpt (read): </td><td> {{key_val_read['run_info:post_stop_script']}}  </td>
            <td> <button class="btn btn-gray" @click="exec_hook_script('run_info:post_stop_script')"> Run </button> <span></span></td></tr>
         <tr><td> &nbsp; </td><td> &nbsp; </td></tr>
         <tr><td> Pre-start script (set): </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:pre_start_script']"> <span></span>
           </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:pre_start_script')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:pre_start_script')"> Clear </button> <span></span>
            </td>
         </tr>
         <tr><td> Post-start script (set):  </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:post_start_script']"> <span></span>
            </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:post_start_script')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:post_start_script')"> Clear </button> <span></span>
            </td>
         </tr>
         <tr><td> Pre-stop script (set): </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:pre_stop_script']"> <span></span>
            </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:pre_stop_script')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:pre_stop_script')"> Clear </button> <span></span>
            </td>
         </tr>
         <tr><td> Post-stop script (set): </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:post_stop_script']"> <span></span>
            </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:post_stop_script')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:post_stop_script')"> Clear </button> <span></span>
            </td>
         </tr>
      </table>
   </div>
   <div>&nbsp;</div>
   <div>
      <NestDAQStateList :apiBase="fastapi_uri"></NestDAQStateList>
      <NestDAQSoundAlert :apiBase="fastapi_uri"></NestDAQSoundAlert>
   </div>
</template>

<style>
  .btn {
    @apply font-bold py-1 px-2 rounded;
  }
  .btn-blue {
    @apply bg-blue-500 text-white;
  }
  .btn-blue:hover {
    @apply bg-blue-700;
  }
  .btn-blue-disabled{
    @apply bg-blue-500 text-white opacity-50 cursor-not-allowed;
  }
  .btn-gray {
    @apply bg-gray-500 text-white;
  }
  .btn-gray:hover {
    @apply bg-gray-700;
  }
  .btn-gray-disabled{
    @apply bg-gray-500 text-white opacity-50 cursor-not-allowed;
  }
  .inpt {
    @apply bg-gray-50 border border-gray-300 text-gray-900
    text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500
    p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
    dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500;
  }
   .warn-box {
      @apply bg-amber-50 border border-amber-400 text-amber-900 rounded p-3 my-2;
   }
   .caption {
      @apply text-sm text-gray-700 my-2;
   }
</style>

<script>
import axios from 'axios'
import NestDAQStateList  from './NestDAQStateList.vue'
import NestDAQSoundAlert from './NestDAQSoundAlert.vue'
import { useGlobalStore } from '@/stores/global';
import { getPartApi } from '@/utilities/ApiRegistry';
export default {
   components: {
      NestDAQStateList,
      NestDAQSoundAlert,
   },
   data() {
      return {
         objectPool: useGlobalStore().objectPool,
         fastapi_uri: "",
         api_part_key: "nestdaq-controller",
         browser_tab_id: 0,
         state_change_start_time_in_sec: 0,
         state_change_elapsed_time_in_sec: 0,
         state_change_timeout_in_sec: 20,
         daq_controllable: true,
         daq_state: "",
         daq_current_time: "",
         daq_start_time: "",
         daq_stop_time: "",
         expert_mode_enabled: false,
         run_elapsed_time: 0,
         redis_ready: false,
         redis_initialized: false,
         daq_state_destination: {
            "CONNECT"      : "DEVICE READY",
            "INIT TASK"    : "READY",
            "RUN"          : "RUNNING",
            "STOP"         : "READY",
            "RESET TASK"   : "DEVICE READY",
            "RESET DEVICE" : "IDLE",
            "END"          : "NO PROCESS"
         },
         key_val_read: {
            "run_info:pre_start_script"           : "",
            "run_info:post_start_script"          : "",
            "run_info:pre_stop_script"            : "",
            "run_info:post_stop_script"           : "",
            "run_info:run_number"                 : "",
            "run_info:latest_run_number"          : "",
            "run_info:run_comment"                : "",
            "run_info:run_start_unix_time"        : "",
            "run_info:daq_error_status"           : "",
            "run_info:auto_run_change_mode"       : "",
            "run_info:auto_run_change_dur"        : "",
            "run_info:auto_run_change_ctl_holder" : ""
         },
         key_val_set: {
            "run_info:pre_start_script"           : "",
            "run_info:post_start_script"          : "",
            "run_info:pre_stop_script"            : "",
            "run_info:post_stop_script"           : "",
            "run_info:run_number"                 : "",
            "run_info:latest_run_number"          : "",
            "run_info:run_comment"                : "",
            "run_info:run_start_unix_time"        : "",
            "run_info:daq_error_status"           : "",
            "run_info:auto_run_change_mode"       : "",
            "run_info:auto_run_change_dur"        : "",
            "run_info:auto_run_change_ctl_holder" : ""
         },
         hook_return: {
            "run_info:pre_start_script"  : "",
            "run_info:post_start_script" : "",
            "run_info:pre_stop_script"   : "",
            "run_info:post_stop_script"  : ""
         },
         hook_cmd_key: {
            "PRE START"   : "run_info:pre_start_script",
            "POST START"  : "run_info:post_start_script",
            "PRE STOP"    : "run_info:pre_stop_script",
            "POST STOP"   : "run_info:post_stop_script"
         }
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
         // Redis status check
         axios.get(this.fastapi_uri + '/redis/status')
         .then((response) => {
            this.redis_ready = !!response.data?.connected;
         }).catch(() => {
            this.redis_ready = false;
         });
         
         if (!this.redis_ready) {
            setTimeout(() => { this.update(); }, 1000);
            return;
         }
         if (!this.redis_initialized) {
            for (let key in this.key_val_read){
               this.key_init(key);
            }
            this.redis_initialized = true;
         }
         this.check_daq_state();
         this.check_auto_run_change();
         this.daq_current_time = new Date();
         for (let key in this.key_val_read){
            this.key_read(key);
         }
         this.objectPool["daq"]["state"] = this.daq_state;
         this.objectPool["daq"]["controllable"] = this.daq_controllable;
         this.objectPool["daq"]["start_time"] = this.daq_start_time; 
         this.objectPool["daq"]["stop_time"] = this.daq_stop_time;
         this.objectPool["daq"]["run_number"] = this.key_val_read['run_info:run_number'];
         this.objectPool["daq"]["latest_run_number"] = this.key_val_read['run_info:latest_run_number'];
         this.objectPool["daq"]["run_comment"] = this.key_val_read['run_info:run_comment'];
         this.objectPool["daq"]["elapsed_time"] = this.run_elapsed_time;
         setTimeout(() => { this.update(); }, 1000);
      },
      
      check_daq_state(){
         axios.get(this.fastapi_uri+'/nestdaq/status/')
         .then((response) => {
            let res = response.data;
            if (Object.keys(res).length == 0) {
               this.daq_state = "NO PROCESS";
               return;
            }
            let mismatch_flag = false;
            for (let key in res){
              if (res[key] != Object.values(res)[0]) {
                  mismatch_flag = true;
               }
            }
            if(mismatch_flag == false){
               this.daq_state = Object.values(res)[0];
            }else{
               this.daq_state = "";
            }
         }).catch((error)=>{console.log(error.data);});
      },
      check_auto_run_change(){
         if (this.browser_tab_id == this.key_val_read['run_info:auto_run_change_ctl_holder']){
            this.key_expire('run_info:auto_run_change_mode',10);
            this.key_expire('run_info:auto_run_change_ctl_holder',10);
         }
         if (this.key_val_read['run_info:run_start_unix_time'] > 0 && this.daq_state == "RUNNING") {
            this.run_elapsed_time = parseInt(Date.now()/1000 - this.key_val_read['run_info:run_start_unix_time']);
            if ((this.run_elapsed_time >= this.key_val_read['run_info:auto_run_change_dur'])&&
                (this.key_val_read['run_info:auto_run_change_mode'] == "enabled")&&
                (this.browser_tab_id == this.key_val_read['run_info:auto_run_change_ctl_holder'])&&
                (this.daq_controllable == true)) {
               this.key_val_set['run_info:run_start_unix_time'] = 0;
               this.key_set('run_info:run_start_unix_time');
               this.state_change(["PRE STOP", "STOP","RESET TASK","RESET DEVICE", "POST STOP",
               "PRE START","CONNECT","INIT TASK","RUN","POST START"]);
            }
         }
      },
      auto_run_change_enable(){
         if (this.key_val_read['run_info:auto_run_change_mode'] != "enabled"&&
             (this.browser_tab_id == this.key_val_read['run_info:auto_run_change_ctl_holder'])) {
             this.key_val_set['run_info:auto_run_change_mode'] = "enabled";
             this.key_set('run_info:auto_run_change_mode');
             this.auto_run_change_get_ctl();
         }
      },
      auto_run_change_disable(){
         if ((this.key_val_read['run_info:auto_run_change_mode'] == "enabled")&&
             (this.browser_tab_id == this.key_val_read['run_info:auto_run_change_ctl_holder'])) {
             this.key_val_set['run_info:auto_run_change_mode'] = "";
             this.key_set('run_info:auto_run_change_mode');
         }
      },
      auto_run_change_get_ctl(){
         this.key_val_set['run_info:auto_run_change_ctl_holder'] = this.browser_tab_id;
         this.key_set('run_info:auto_run_change_ctl_holder');
      },
      reset_daq_error_status(){
         this.key_val_set['run_info:daq_error_status'] = "";
         this.key_set('run_info:daq_error_status');
         this.daq_controllable = true;
      },
      key_set(key){
         if (key=="run_info:run_comment"){
            if (this.key_val_set[key].length > 255) {
               this.key_val_set[key] = this.key_val_set[key].substring(0, 255);
            }
         }
         //this.key_val_read[key] = this.key_val_set[key];
         axios.get(this.fastapi_uri+'/nestdaq/set_path/'+key+'/'+this.key_val_set[key])
         .then(()=>{            
            this.key_read(key);
         })
         .catch((error)=>{console.log(error.data);});
      },
      key_expire(key, time){
         axios.get(this.fastapi_uri+'/expire/'+key+'/'+time)
         .catch((error)=>{console.log(error.data);});
      },
      key_clear(key){
         this.key_val_set[key] = "";
      },
      key_read(key){
         axios.get(this.fastapi_uri+'/get/'+key)
         .then((response) => {
            this.key_val_read[key] = response.data["message"];
         }).catch((error)=>{console.log(error.data);});
      },
      key_init(key){
         axios.get(this.fastapi_uri+'/get/'+key)
         .then((response) => {
            this.key_val_set[key] = response.data["message"];
         }).catch((error)=>{console.log(error.data);});
      },
      exec_hook_script(key){
         return new Promise ((resolve, reject) => {
            axios.get(this.fastapi_uri+'/get/'+key)
            .then((response) => {
               let res = response.data["message"];
               axios.get(this.fastapi_uri+'/syscmd/exec/'+res)
               .then((response) => {
                  this.hook_return[key] = response.data["message"];
                  resolve();  
               }).catch((error)=>{console.log(error.data); reject();});
            }).catch((error)=>{console.log(error.data); reject();});
         })
      },
      wait_for_state_change(daq_state_dest, start_time_in_sec){
         return new Promise ((resolve,reject) => {
            this.state_change_elapsed_time_in_sec = parseInt(Date.now() / 1000 - start_time_in_sec);
            if (this.state_change_elapsed_time_in_sec >= this.state_change_timeout_in_sec) {
               reject();
            }else{
               if (daq_state_dest != this.daq_state) {
                  setTimeout(()=>{
                     this.wait_for_state_change(daq_state_dest, start_time_in_sec)
                     .then(()=>{resolve();})
                     .catch(()=>{reject();});
                  }, 1000);
               }else{
                  resolve();
               }
            }
         })
      },
      state_change(cmd_arr){
         this.daq_controllable = false;
         this.key_val_set['run_info:daq_error_status'] = "";
         this.key_set('run_info:daq_error_status');
         if (cmd_arr.length == 0) {
            this.daq_controllable = true;
            return;
         }
         if (cmd_arr[0] == "STOP") {
            this.daq_stop_time = new Date();
            axios.get(this.fastapi_uri+'/incr/run_info:run_number')
            .catch((error)=>{console.log(error.data);});
         }
         if (cmd_arr[0] == "RUN") {
            this.daq_start_time = new Date();
            this.key_val_set['run_info:run_start_unix_time'] = parseInt(Date.now()/1000);
            this.key_set('run_info:run_start_unix_time');
            this.daq_stop_time = "";
            axios.get(this.fastapi_uri+'/get/run_info:run_number')
            .then((response) => {
               let res_run_number = response.data["message"];
               axios.get(this.fastapi_uri+'/set/run_info:latest_run_number/'+res_run_number)
               .catch((error)=>{console.log(error.data);});
            }).catch((error)=>{console.log(error.data);});
         }
         switch(cmd_arr[0]) {
            case "PRE START":
            case "PRE STOP":  
               //console.log("PRE START/STOP");
               axios.get(this.fastapi_uri+'/scaler/suspend');
               break;
            case "POST START":
            case "POST STOP":
               //console.log("POST START/STOP");
               axios.get(this.fastapi_uri+'/scaler/resume');
               break;
            default:
               //console.log("default");
               break;
         }
         if ((cmd_arr[0] == "PRE START") || (cmd_arr[0] == "POST START") ||
             (cmd_arr[0] == "PRE STOP")  || (cmd_arr[0] == "POST STOP")  ) {
            this.exec_hook_script(this.hook_cmd_key[cmd_arr[0]])
            .then(()=>{
               cmd_arr.shift();
               this.state_change(cmd_arr);
            }).catch((error)=>{
               this.key_val_set['run_info:daq_error_status'] = "script_error";
               this.key_set('run_info:daq_error_status');
               console.log(error.data);
            });
         }else{
            let daqctl_msg = '{"command":"change_state","value":"'+cmd_arr[0]+'","services":["all"],"instances":["all"]}';
            axios.get(this.fastapi_uri+'/publish/daqctl/'+daqctl_msg)
            .then(()=>{
               this.state_change_start_time_in_sec = parseInt(Date.now() / 1000);
               this.wait_for_state_change(this.daq_state_destination[cmd_arr[0]], this.state_change_start_time_in_sec)
               .then(()=>{
                  cmd_arr.shift();
                  this.state_change(cmd_arr);
               }).catch(()=>{
                  this.key_val_set['run_info:daq_error_status'] = "wait_for_state_change";
                  this.key_set('run_info:daq_error_status');
               });
            }).catch((error)=>{
               this.key_val_set['run_info:daq_error_status'] = "publish_error";
               this.key_set('run_info:daq_error_status');
               console.log(error.data);
            });
         }
      }
   },
   mounted() {
      this.objectPool["daq"] = {};
      this.refreshApiBase();
      this.refreshRedisStatus();
      this.update();
      this.browser_tab_id = sessionStorage.tabID ? 
         sessionStorage.tabID : 
         sessionStorage.tabID = parseInt((Math.random())*1e10);
   }
}
</script>

<style>
div.state {
border: 1px solid blue;
}
</style>
