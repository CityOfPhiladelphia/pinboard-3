import { createApp } from 'vue';
import { createPinboard } from '@pinboard/ui';
import App from './App.vue';
import i18n from './i18n';
const app = createApp(App);
app.use(i18n);
app.use(createPinboard({
    title: 'Primary Care Finder',
    map: {
        center: [-75.16, 39.95],
        zoom: 12,
    },
}));
app.mount('#app');
