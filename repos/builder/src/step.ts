import { BuildConfig } from "./config";
import { Logger } from "./logger";

export abstract class BuildStep {
  protected logger: Logger;

  #name: string;

  constructor(name: string) {
    this.logger = new Logger(name);
    this.#name = name;
  }

  get name(): string {
    return this.#name;
  }

  abstract run(): Promise<void>;
}

export class StepRunner {
  #logger: Logger;
  #steps: BuildStep[];

  constructor(steps: (new () => BuildStep)[]) {
    this.#logger = new Logger("Builder");

    this.#steps = steps.map((step) => new step());
  }

  async runAll() {
    this.#logger.info(`Starting build for ${BuildConfig.platform}`);

    for (const step of this.#steps) {
      await this.#runStep(step);
    }
  }

  async #runStep(step: BuildStep) {
    this.#logger.stepStarting(step.name);

    await step.run();

    this.#logger.stepDone(step.name);
  }
}
