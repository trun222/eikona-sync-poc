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
        <!-- Select Sync Option -->
        <v-btn-toggle
          v-model="toggleSyncType"
          mandatory
        >
          <v-btn>
            Local
          </v-btn>
          <v-btn>
            Remote
          </v-btn>
        </v-btn-toggle>

        <!-- Local Sync -->
        <local-sync v-if="toggleSyncType === 0"></local-sync>
        <!-- Remote Sync -->
        <remote-sync v-if="toggleSyncType === 1"></remote-sync>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from "vue-property-decorator";

@Component({
  name: "App",
  components: {
    LocalSync: () => import(/* webpackChunkName: "LocalSync.vue"  */ './components/LocalSync.vue'),
    RemoteSync: () => import(/* webpackChunkName: "RemoteSync.vue"  */ './components/RemoteSync.vue'),
  },
})
export default class App extends Vue {
  public toggleSyncType: any = 0;
}
</script>

<style lang="scss"></style>
