<template>
  <v-app>
    <!-- Nav Bar -->
    <v-app-bar
      app
      color="secondary"
      dark
    >
      <div class="d-flex align-center">
        <h1>Eikona Sync</h1>
      </div>
    </v-app-bar>

    <v-main>
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
        <!-- Sync Dir -->
        <v-row align-content="center" justify="center">
          <v-col cols="8">
            <v-btn @click="handleSelectSyncDir" class="d-inline-block">Sync Dir</v-btn>

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
            <v-btn @click="handleSelectOutputDir" class="d-inline-block">Output</v-btn>
            <v-text-field
              v-model="outputPath"
              class="d-inline-block ml-5 sync-dir-input"
              label="Path..."
              solo
            ></v-text-field>   
          </v-col>
        </v-row> 

        <!-- Sync Button -->
        <v-row>
          <v-col cols="12">
            <v-btn @click="handleStartSync" :disabled="disableSync" color="success" block>Sync</v-btn>
          </v-col>
        </v-row>     
        <!-- Stop Sync Button -->
        <v-row>
          <v-col cols="12">
            <v-btn v-if="disableSync" @click="handleKillSync" color="warning" block>Stop</v-btn>
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
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from "vue-property-decorator";
import VueScrollTo from 'vue-scrollto';


@Component({
  name: "App",
  components: {},
})
export default class App extends Vue {
  private ipcRenderer: any = (window as any).ipcRenderer;
  public syncPath = "";
  public outputPath = "";
  public disableSync = false;
  public syncCompleted = false;
  public syncOutput: string[] = [];
  public scrollOptions: any = {
    container: '.output-container',
    easing: 'ease-in',
    offset: -100,
    force: false,
    cancelable: true,
    onStart: function(element: any) {
      // scrolling started
    },
    onDone: function(element: any) {
      // scrolling is done
    },
    onCancel: function() {
      // scrolling has been interrupted
    },
    x: false,
    y: true
  };

  created() {
    window.addEventListener('beforeunload', () => {
      this.ipcRenderer.send('kill-sync');
    })
  }

  beforeDestory() {
    // Remove event listener
    window.removeEventListener('beforeunload', () => null);
  }

  mounted() {
    this.ipcRenderer.on('sync-complete', (event: any, data: any) => {
      // Sync completed
      this.syncCompleted = true;
    });

    this.ipcRenderer.on('selected-directory', (event: any, data: any) => {
      (this as any)[`${data.caller}Path`] = data.result;
    });

    this.ipcRenderer.on('sync-inprogress', (event: any, data: any) => {
      this.syncOutput = [...this.syncOutput, data];
      const el = document.getElementById('scroll-target');
      if(this.syncOutput.length > 0 && el) {
        VueScrollTo.scrollTo('#scroll-target', 2000, this.scrollOptions);
      }
    });
  }

  public handleSelectSyncDir() {
    this.ipcRenderer.send('open-file-dialog', 'sync');
  }

  public handleSelectOutputDir() {
    this.ipcRenderer.send('open-file-dialog', 'output');
  }

  public handleKillSync() {
    this.ipcRenderer.send('kill-sync');
  }

  public handleStartSync() {
    this.disableSync = true;
    this.ipcRenderer.send('start-sync', {
      syncPath: this.syncPath,
      outputPath: this.outputPath
    });
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
</style>
