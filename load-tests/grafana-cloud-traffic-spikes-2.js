import trafficSpikeJourney, {
  apiRequestRateScenario,
  handleSummary,
  options as baseOptions,
  regionalJourneyScenario,
  storefrontActionsScenario
} from './grafana-cloud-traffic-spikes.js';

// Cloud k6 worker env injection:
//   set -a && source .env && set +a
//   K6_CLOUD_TOKEN="$K6_CLOUD_TOKEN" k6 cloud run \
//     -e API_TEST_KEY="$API_TEST_KEY" \
//     -e STOREFRONT_BASE_URL=https://ensemble-grafana.com \
//     -e API_BASE_URL=https://ensemble-grafana.com \
//     load-tests/grafana-cloud-traffic-spikes-2.js
// Plain shell env assignments before `k6 cloud run` authenticate the uploader, but
// `-e` is what injects protected app env vars into the remote cloud workers.

export const options = {
  ...baseOptions,
  cloud: {
    ...(baseOptions.cloud || {}),
    name: 'ensemble-grafana-traffic-spikes-2'
  }
};

export {
  apiRequestRateScenario,
  handleSummary,
  regionalJourneyScenario,
  storefrontActionsScenario,
  trafficSpikeJourney
};

export default trafficSpikeJourney;
