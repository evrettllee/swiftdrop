import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { describeError } from '@/common/utils/describe-error';
import { ASSIGNMENT_INTERVAL_MS } from '../constants/assignment.constants';
import { AssignmentRoundService } from '../services/assignment-round.service';

@Injectable()
export class AssignmentJob {
  private readonly logger = new Logger(AssignmentJob.name);
  private isRunning = false;

  constructor(private readonly rounds: AssignmentRoundService) {}

  // A round that takes longer than the interval is not overlapped by the next one.
  @Interval(ASSIGNMENT_INTERVAL_MS)
  async runScheduled(): Promise<void> {
    if (!this.isRunning) {
      this.isRunning = true;

      try {
        await this.rounds.run();
      } catch (error) {
        this.logger.error(`Assignment round failed: ${describeError(error)}`);
      } finally {
        this.isRunning = false;
      }
    }
  }
}
