import { Body, Controller, Post } from '@nestjs/common';
import { OiicsSearchResponse } from '@praesid/shared';
import { OiicsService } from './oiics.service';
import { SearchOiicsCodesDto } from './dto/search-oiics-codes.dto';

@Controller('oiics')
export class OiicsController {
  constructor(private readonly oiicsService: OiicsService) {}

  @Post('search')
  searchCodes(@Body() dto: SearchOiicsCodesDto): Promise<OiicsSearchResponse> {
    return this.oiicsService.searchCandidateCodes(dto.narrative);
  }
}
