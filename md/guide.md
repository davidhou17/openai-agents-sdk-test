# Get Started with the OpenAI Agents SDK for TypeScript

OpenAI Agents SDK is a lightweight yet powerful framework for building agentic AI applications. Use this guide to get started with the OpenAI Agents SDK for TypeScript and build your first application.

If you're familiar with the concept of AI agents, you can [get started](#build-ai-agents-with-the-openai-agents-sdk).

## What is an AI agent?

In the context of generative AI, an agent typically refers to a system that uses AI models such as LLMs to complete tasks autonomously. Agents consist of the following key components:

- **Perception**: The input to the agent. Text inputs are the most common perception mechanism for AI agents, but inputs can also be audio, images, or multimodal data.
- **Planning**: How the agent determines what to do next. This component might include LLMs, feedback loops, and prompt engineering techniques like chain-of-thought or reAct to reason through a task. It might also include using memory systems to draw from the agent's past experiences to inform its decisions.
- **Tools**: How the agent performs actions for the task. Tools are executable functions that allow agents to perform actions beyond the scope of the LLM alone, such as interacting with external APIs, services, and data sources.

Agentic applications might use a single LLM as the decision-maker, multiple LLMs, or even multiple agents that work together to complete a task. 

### Use Cases

Unlike traditional AI assistants that require human intervention, AI agents can reason through tasks and make decisions autonomously. This makes them suitable for complex or unstructured tasks that require multiple steps, interacting with external systems, or adapting to their environment. Consider the following table that compares use cases:

| AI Assistant | AI Agent |
|---------|-------------|
| Translate a document | Create a personalized report in multiple languages |
| Answer a question about a topic | Retrieve relevant information from multiple knowledge bases and provide a comprehensive answer |
| Generate code for a simple task | Explore my codebase, generate a new feature, and test that it works |

## Build AI agents with the OpenAI Agents SDK

The OpenAI Agents SDK enables you to build agentic AI applications with a small but versatile set of abstractions. The SDK provides the following primitives:

* **Agents**: The main building block of your agentic application. This component is an LLM configured with instructions, the model to use, and any tools.
* **Guardrails**: Components that run with your agent to validate the agent's inputs and outputs.
* **Handoffs**: Mechanism to coordinate interactions between multiple agents.

The OpenAI Agents SDK also supports turning any TypeScript function into tools for agents, options for enabling [human-in-the-loop](placeholder) workflows, built-in [tracing](placeholder) to visualize and debug your agents, and additional abstractions for building [voice agents](placeholder).

## Tutorial

In this tutorial, you build an agentic weather application that generates weather reports. Specifically, you complete the following steps:

- Configure an **agent** with a tool that gets the current weather.
- Add a **guardrail** to validate the agent's input.
- Add a **handoff** to another agent to predict the weather based on the current weather.
- Run the application to generate the final weather report.

### Prerequisites

Before you begin, ensure that you have the following:

- [Node.js](https://nodejs.org/) version 22 or later.
- An [OpenAI API key](https://platform.openai.com/account/api-keys).

### Set up the environment

Complete the following steps to set up your project environment:

1. Create and initialize a new project.

   ```bash
   mkdir openai-agent-project
   cd openai-agent-project
   npm init -y
   ```

   After initializing the project, ensure that your `package.json` file includes the `"type": "module"` field.

2. Install the dependencies.

   ```bash
   npm install @openai/agents zod
   ```

3. Export your OpenAI API key as an environment variable.

   ```
   export OPENAI_API_KEY="<openai_api_key>"
   ```

### Create your first agent

In your project, create a file named `index.ts` and add the following code. This code does the following:

- Creates a tool named `getWeather` that returns the weather for a given location.
- Uses the `Agent` primitive to configure a basic weather agent with instructions, the LLM to use, and the tool.

```typescript
import { Agent, tool } from '@openai/agents';
import { z } from 'zod';

// Tool to get the weather for a given location
const getWeather = tool({
  name: 'get_weather',
  description: 'Return the weather for a given location.',
  parameters: z.object({ location: z.string() }),
  async execute({ location }) {
  // In a real application you might call a weather API here
    return `The weather in ${location} is currently sunny.`;
  },
});

// Agent that uses the getWeather tool
const weatherAgent = new Agent({
  name: 'Weather Bot',
  instructions: 'You are a weather bot.',
  model: 'gpt-4o',
  tools: [getWeather],
});
```

### Add a guardrail

Modify the `index.ts` file with the following code to add a guardrail that checks if the user provided a location. This code does the following:
- Creates a guardrail agent that checks if the input contains a location.
- Defines the guardrail logic to check if the input contains a location.
- Updates the weather agent to include the guardrail.

To learn more, see [Guardrails](placeholder).

```typescript
import {
  Agent, tool,
  run, InputGuardrailTripwireTriggered, InputGuardrail
} from '@openai/agents';
import { z } from 'zod';

const getWeather = tool({
   // existing code...
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
```

### Add a handoff

Next, modify your `index.ts` file with the following code. This code does the following:
- Creates a forecast agent that predicts the weather based on the current weather.
- Creates a final weather report agent that uses a handoff to pass the results from the weather agent to the forecast agent.

By default, handoffs pass the current conversation context to the new agent, allowing it to use the existing context to perform relevant actions. To learn more, see [Handoffs](placeholder).

```typescript
import {
  Agent, tool,
  run, InputGuardrailTripwireTriggered, InputGuardrail,
  handoff
} from '@openai/agents';
import { z } from 'zod';

// existing code...

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
```

### Run the agent

To run the agent, add the following code to the end of your `index.ts` file:

```typescript

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
```

Save the file, then run your agent with the following command:

```bash
npx tsx index.ts
```

Sample output:
```
Agent response: Weather report summary: The weather in San Francisco is currently sunny. However, it might rain eventually.
```

## Next steps

Explore additional features of the OpenAI Agents SDK:

- Use [tracing](placeholder) to visualize, debug, and monitor your agentic workflows.
- Build [voice agents](placeholder) that can interact with users through audio inputs and outputs.
