import trafficSpikeJourney, {
  apiRequestRateScenario,
  handleSummary,
  options as baseOptions,
  regionalJourneyScenario,
  storefrontActionsScenario
} from './grafana-cloud-traffic-spikes.js';

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
