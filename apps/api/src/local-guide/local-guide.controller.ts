import { Controller, Get } from "@nestjs/common";
import { LocalGuideService } from "./local-guide.service";

@Controller("local-guide")
export class LocalGuideController {
  constructor(private readonly localGuide: LocalGuideService) {}

  @Get()
  findAll() {
    return this.localGuide.findAll();
  }
}
