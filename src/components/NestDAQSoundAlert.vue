<template>
   <div>
      <span class="text-xl font-bold"> NestDAQ Sound Alert</span> <span></span>
      <span><input type="checkbox" v-model="sound_activated">: </span>
      <span v-if="sound_activated == true"> Activated </span>
      <span v-else> Inactivated </span>
   </div>
   <div>
      <span class="text-l font-bold"> Configuration panel: </span> <span></span>
      <span><input type="checkbox" v-model="config_panel_enabled">: </span>
      <span v-if="config_panel_enabled == true">Enabled</span>
      <span v-else> Disabled</span>
   </div>
   <div v-if="config_panel_enabled == true">
      Selected file: <span v-if="key_val_read['run_info:sound_file_option']==''"> Default</span>
      <span v-else> {{key_val_read['run_info:sound_file_option']}} </span>
      <table>
         <tr><td>
            <input type="radio" value="" v-model="key_val_read['run_info:sound_file_option']"
               @click="set_sound_file_option('')" />
            Default </td><td></td>
            <td> <button class="btn btn-gray" @click="play_sound('')"> Play </button> <span></span> </td></tr>
         <tr><td>
            <input type="radio" value="run_info:sound_file_uri_1" v-model="key_val_read['run_info:sound_file_option']"
               @click="set_sound_file_option('run_info:sound_file_uri_1')" />
            Sound file URI option 1 (read): </td><td> {{key_val_read['run_info:sound_file_uri_1']}} </td>
            <td> <button class="btn btn-gray" @click="play_sound('run_info:sound_file_uri_1')"> Play </button> <span></span></td></tr>
         <tr><td>
            <input type="radio" value="run_info:sound_file_uri_2" v-model="key_val_read['run_info:sound_file_option']"
               @click="set_sound_file_option('run_info:sound_file_uri_2')" />
            Sound file URI option 2 (read):  </td><td> {{key_val_read['run_info:sound_file_uri_2']}}   </td>
            <td> <button class="btn btn-gray" @click="play_sound('run_info:sound_file_uri_2')"> Play </button> <span></span></td></tr>
         <tr><td>
            <input type="radio" value="run_info:sound_file_uri_3" v-model="key_val_read['run_info:sound_file_option']"
               @click="set_sound_file_option('run_info:sound_file_uri_3')" />
            Sound file URI option 3 (read): </td><td> {{key_val_read['run_info:sound_file_uri_3']}}  </td>
            <td> <button class="btn btn-gray" @click="play_sound('run_info:sound_file_uri_3')"> Play </button> <span></span></td></tr>
         <tr><td> &nbsp; </td><td> &nbsp; </td></tr>
         <tr><td> Sound file URI option 1 (set):  </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:sound_file_uri_1']"> <span></span>
            </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:sound_file_uri_1')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:sound_file_uri_1')"> Clear </button> <span></span>
            </td>
         </tr>
         <tr><td> Sound file URI option 2 (set): </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:sound_file_uri_2']"> <span></span>
            </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:sound_file_uri_2')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:sound_file_uri_2')"> Clear </button> <span></span>
            </td>
         </tr>
         <tr><td> Sound file URI option 3 (set): </td>
            <td>
               <input size="50" class="inpt" type="text" v-model="key_val_set['run_info:sound_file_uri_3']"> <span></span>
            </td><td>
               <button class="btn btn-gray" @click="key_set('run_info:sound_file_uri_3')"> Set </button> <span></span>
               <button class="btn btn-gray" @click="key_clear('run_info:sound_file_uri_3')"> Clear </button> <span></span>
            </td>
         </tr>
      </table>
   </div>
   <div>&nbsp;</div>
</template>
<style>
  .btn {
    @apply font-bold py-1 px-2 rounded;
  }
  .btn-gray {
    @apply bg-gray-500 text-white;
  }
</style>
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
         api_part_key: "nestdaq-sound-alert",
         config_panel_enabled : false,
         sound_activated: false,
         playing_sound: false,
         key_val_read: {
            "run_info:daq_error_status"   : "",
            "run_info:sound_file_option"  : "",
            "run_info:sound_file_uri_1"   : "",
            "run_info:sound_file_uri_2"   : "",
            "run_info:sound_file_uri_3"   : ""
         },
         key_val_set: {
            "run_info:sound_file_uri_1"   : "",
            "run_info:sound_file_uri_2"   : "",
            "run_info:sound_file_uri_3"   : ""
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
         for (let key in this.key_val_read){
            this.key_read(key);
         }
         this.check_daq_error();
         setTimeout(() => { this.update(); }, 1000);
      },
      check_daq_error(){
         if ((this.sound_activated  == true) &&
             (this.key_val_read['run_info:daq_error_status'] != "") &&
             (this.playing_sound == false)){
            this.playing_sound = true;
            this.repeat_play();
         }
      },
      repeat_play(){
         if ((this.sound_activated  == true) &&
             (this.key_val_read['run_info:daq_error_status'] != "")){
            let sound = this.play_sound(this.key_val_read['run_info:sound_file_option']);
            let _this = this;
            sound.addEventListener('ended',function(){
               _this.repeat_play();
            });
         }else{
            this.playing_sound = false;
         }
      },
      set_sound_file_option(val){
         axios.get(this.fastapi_uri+'/nestdaq/set_path/run_info:sound_file_option/'+val)
         .then(()=>{
            this.key_read('run_info:sound_file_option');
         })
         .catch((error)=>{console.log(error.data);});
      },
      key_set(key){
         axios.get(this.fastapi_uri+'/nestdaq/set_path/'+key+'/'+this.key_val_set[key])
         .then(()=>{            
            this.key_read(key);
         })
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
      play_sound(key){
         let sound;
         if (key == "") {
             sound = new Audio("data:audio/wav;base64," + this.return_base64());
         }else{
             sound = new Audio(this.key_val_read[key]);
         }
         sound.play();
         return sound;
      },
      return_base64(){
         return "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";
      }
   },
   mounted() {
      this.refreshApiBase();
      this.update()
      if (!this.fastapi_uri) {
         return;
      }
      for (let key in this.key_val_read){
         this.key_init(key);
      }
   }
}
</script>
