import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IncidentDetail,
  IncidentSummary,
  OiicsStructure,
  SimilarIncident,
} from '@praesid/shared';
import { IncidentsService } from './incidents.service';
import { ClassificationService } from './classification.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsDto } from './dto/list-incidents.dto';
import { UpdateIncidentCodeStatusDto } from './dto/update-incident-code-status.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly classificationService: ClassificationService,
  ) {}

  @Post()
  createIncident(@Body() dto: CreateIncidentDto): Promise<IncidentDetail> {
    return this.incidentsService.createIncident(dto);
  }

  @Get()
  listIncidents(@Query() query: ListIncidentsDto): Promise<IncidentSummary[]> {
    return this.incidentsService.listIncidents(query.tenantId);
  }

  @Get(':id')
  getIncident(@Param('id') id: string): Promise<IncidentDetail> {
    return this.incidentsService.getIncident(id);
  }

  @Post(':id/classify')
  classifyIncident(@Param('id') id: string): Promise<IncidentDetail> {
    return this.classificationService.classifyIncident(id);
  }

  @Get(':id/similar')
  findSimilarIncidents(@Param('id') id: string): Promise<SimilarIncident[]> {
    return this.incidentsService.findSimilarIncidents(id);
  }

  @Patch(':id/codes/:structure')
  updateCodeStatus(
    @Param('id') id: string,
    @Param('structure') structure: string,
    @Body() dto: UpdateIncidentCodeStatusDto,
  ): Promise<IncidentDetail> {
    return this.incidentsService.updateCodeStatus(
      id,
      structure as OiicsStructure,
      dto.status,
    );
  }
}
