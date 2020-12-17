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

        <!-- Output Container -->
        <v-card class="output-container mt-4 pa-2">
          <template v-for="(line, index) in syncOutput">
            <p v-if="syncOutput.length > 0" :key="line + index">{{line}}</p>
          </template>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from "vue-property-decorator";

@Component({
  name: "App",
  components: {},
})
export default class App extends Vue {
  private ipcRenderer: any = (window as any).ipcRenderer;
  public syncPath = "";
  public outputPath = "";
  public disableSync = false;
  public syncOutput: string[] = [];

  mounted() {
    this.ipcRenderer.on('selected-directory', (event: any, data: any) => {
      (this as any)[`${data.caller}Path`] = data.result;
    });

    this.ipcRenderer.on('sync-inprogress', (event: any, data: any) => {
      console.log(data);
      this.syncOutput = [...this.syncOutput, data];
    });
  }

  public handleSelectSyncDir() {
    this.ipcRenderer.send('open-file-dialog', 'sync');
  }

  public handleSelectOutputDir() {
    this.ipcRenderer.send('open-file-dialog', 'output');
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
