import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { FullConfig, Reporter } from '@playwright/test/reporter';

type HtmlReportLinkOptions = {
  outputFolder?: string;
};

class HtmlReportLinkReporter implements Reporter {
  private reportIndexUrl: string | undefined;

  constructor(private readonly options: HtmlReportLinkOptions = {}) {}

  onBegin(config: FullConfig): void {
    void config;

    if (!this.options.outputFolder) {
      return;
    }

    this.reportIndexUrl = pathToFileURL(
      path.resolve(this.options.outputFolder, 'index.html'),
    ).href;
  }

  onEnd(): void {
    if (!this.reportIndexUrl) {
      return;
    }

    console.log(`HTML report: ${this.reportIndexUrl}`);
  }
}

export default HtmlReportLinkReporter;
