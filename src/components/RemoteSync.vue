<template>
    <v-container>
        <!-- Sync Completed -->
        <v-alert
            v-if="syncCompleted"
            outlined
            type="success"
            text
        >
            Your sync was successful!
        </v-alert>

        <!-- Remote Sync -->
        <h1 class="text-center">Remote Sync</h1>

        <!-- Sync Dir -->
        <v-row align-content="center" justify="center">
            <v-col cols="8">
            <v-btn @click="emitter(ACTIONS.DIRECTORY_OPEN, { type: 'syncPath' })" class="d-inline-block">Sync Dir</v-btn>

            <v-text-field
                v-model="syncPath"
                class="d-inline-block ml-5 sync-dir-input"
                label="Path..."
                solo
            ></v-text-field>   
            </v-col>
        </v-row> 

        <!-- Output Dir -->
        <v-row align-content="center" justify="center">
            <v-col cols="8">
            <v-btn class="d-inline-block remote-output-btn">Sync Dir</v-btn>
            <v-text-field
                v-model="outputPath"
                class="d-inline-block ml-5 sync-dir-input"
                label="[USER]@[HOST]:[PATH]"
                solo
            ></v-text-field>   
            </v-col>
        </v-row> 

        <!-- Sync Button -->
        <v-row>
            <v-col cols="12">
            <v-btn @click="handleSyncStart" :disabled="disableSync" color="success" block>Sync</v-btn>
            </v-col>
        </v-row>     
        <!-- Stop Sync Button -->
        <v-row>
            <v-col cols="12">
            <v-btn v-if="disableSync" @click="handleSyncKill" color="warning" block>Stop</v-btn>
            </v-col>
        </v-row>     

        <!-- Output Container -->
        <v-card v-if="syncOutput.length > 0" class="output-container mt-4 pa-2">
            <template v-for="(line, index) in syncOutput">
            <p :key="line + index">{{line}}</p>
            </template>
            <!-- Used for Scroll to -->
            <div id="scroll-target"></div>
        </v-card>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from "vue-property-decorator";
import VueScrollTo from 'vue-scrollto';
import { ACTIONS } from '../util/ACTIONS.enum';


@Component({
  name: "RemoteSync"
})
export default class RemoteSync extends Vue {
  private ipcRenderer: any = (window as any).ipcRenderer;
  public syncPath = "";
  public outputPath = "";
  public isScrolling = false;
  public disableSync = false;
  public syncCompleted = false;
  public syncOutput: string[] = [];
  public ACTIONS = ACTIONS;

  created() {
    window.addEventListener('beforeunload', () => {
      // Don't leak events
      this.killListeners();
      // If there is an active sync kill it
      this.handleSyncKill();
    })
  }

  beforeDestory() {
    window.removeEventListener('beforeunload', () => null);
  }

  mounted() {
    // Events that are being listened to on the front-end
    this.ipcRenderer.on(ACTIONS.ACTION_RECEIVER, (event: any, data: any) => {
      switch(data.ACTION) {
        case ACTIONS.SYNC_INPROGRESS:
          this.handleSyncInProgress(data.result.data);
          break;
        case ACTIONS.SYNC_COMPLETE:
          this.handleSyncComplete();
          break;
        case ACTIONS.DIRECTORY_SELECTED:
          this.handleDirectorySelected(data.result);
          break;
      }
    });
  }

  public killListeners() {
    const listeners = [
      ACTIONS.SYNC_INPROGRESS,
      ACTIONS.SYNC_COMPLETE,
      ACTIONS.DIRECTORY_SELECTED
    ];

    listeners.forEach((l: any) => this.ipcRenderer.removeListener(l));
  }

  // Events that will be emitted to the back-end
  public emitter(ACTION: string, data: any) {
    switch(ACTION) {
      case ACTIONS.SYNC_START:
        this.handleSyncStart();
        break;
      case ACTIONS.SYNC_KILL:
        this.handleSyncKill();
        break;
      case ACTIONS.DIRECTORY_OPEN:
        this.handleSelectSyncDir(data.type);
        break;
    }
  }

  public handleDirectorySelected(result: any) {
    switch(result.type) {
      case 'syncPath':
        this.syncPath = result.data;
        break;
      case 'outputPath':
        this.outputPath = result.data;
        break;
    }
  }

  public handleSyncInProgress(result: any) {
    this.syncOutput = [...this.syncOutput, result];
    this.scrollTo();
  }

  public handleSyncComplete() {
    this.syncCompleted = true;
    this.disableSync = false;
  }

  public handleSelectSyncDir(type: string) {
    this.ipcRenderer.send(ACTIONS.ACTION_RECEIVER, { 
      ACTION: ACTIONS.DIRECTORY_OPEN,
      args: {
        type
      } 
    });
  }

  public handleSyncKill() {
    this.ipcRenderer.send(ACTIONS.ACTION_RECEIVER, {
      ACTION: ACTIONS.SYNC_KILL
    });
  }

  public handleSyncStart() {
    this.disableSync = true;
    this.ipcRenderer.send(ACTIONS.ACTION_RECEIVER, {
      ACTION: ACTIONS.SYNC_START,
      args: {
        syncPath: this.syncPath,
        outputPath: this.outputPath
      }
    });
  }

  public scrollTo() {
    const el = document.getElementById('scroll-target');
    if(this.syncOutput.length > 0 && el && !this.isScrolling) {
      VueScrollTo.scrollTo('#scroll-target', 500, {
        container: '.output-container',
        easing: 'ease-in',
        offset: -70,
        force: true,
        cancelable: false,
        onStart: (element: any) => {
          this.isScrolling = true;
        },
        onDone: (element: any) => {
          this.isScrolling = false;
        },
        onCancel: () => null,
        x: false,
        y: true
      });
    }
  }
}
</script>

<style lang="scss">
.sync-dir-input {
  width: 70%;
}

.output-container {
  height: 500px;
  width: 100%;
  overflow-y: scroll;
}

.remote-output-btn {
  visibility: hidden;
}
</style>
