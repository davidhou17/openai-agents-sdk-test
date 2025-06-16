import {
  Agent, tool,
  run, InputGuardrailTripwireTriggered, InputGuardrail,
  handoff
} from '@openai/agents';
import { z } from 'zod';

// Tool to get the weather for a given location
const getWeather = tool({
  name: 'get_weather',
  description: 'Return the weather for a given location.',
  parameters: z.object({ location: z.string() }),
  async execute({ location }) {
    return `The weather in ${location} is currently sunny.`;
  },
});

// Agent that checks if the input contains a location
const guardrailAgent = new Agent({
  name: 'Guardrail Check',
  instructions: 'Check if the user provided a location in their request.',
  outputType: z.object({
    isLocation: z.boolean(),
    reasoning: z.string(),
  }),
});

// Define the guardrail logic
const locationGuardrail: InputGuardrail = {
  name: 'Location Guardrail',
  execute: async ({ input, context }) => {
    const result = await run(guardrailAgent, input, { context });
    return {
      outputInfo: result.finalOutput,
      tripwireTriggered: !result.finalOutput?.isLocation,
    };
  },
};

// Update the weather agent to include the guardrail
const weatherAgent = new Agent({
  name: 'Weather Bot',
  instructions: 'You are a weather bot.',
  model: 'gpt-4o',
  tools: [getWeather],
  inputGuardrails: [locationGuardrail],
});

// Create a forecast agent that predicts the weather
const forecastAgent = new Agent({
  name: 'Forecast Agent',
  instructions: "You are a forecast bot. If the weather is sunny, predict that it will eventually rain.",
  model: 'gpt-4o'
});

// Coordinate both agents using a handoff
const weatherReportAgent = new Agent({
  name: 'Weather Report Agent',
  instructions: "You are a bot that will generate a weather report summary.",
  handoffs: [weatherAgent, handoff(forecastAgent)],
  model: 'gpt-4o'
});

async function main() {
  try {
    const result = await run(weatherReportAgent, 'What is the weather like in San Francisco?');
    console.log('Agent response:', result.finalOutput);
  } catch (e) {
    if (e instanceof InputGuardrailTripwireTriggered) {
      console.log('Location guardrail tripped');
    }
  }
}
main().catch(console.error);
