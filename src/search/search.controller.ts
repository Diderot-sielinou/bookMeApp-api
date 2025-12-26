import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SearchService } from './search.service';
import { SearchDto, AutocompleteDto } from './dto';
import { Public } from '../common/decorators';

@ApiTags('search')
@Controller('search')
@Public()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search prestataires' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query() query: SearchDto) {
    return this.searchService.search(query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions (autocomplete)' })
  @ApiResponse({ status: 200, description: 'List of suggestions' })
  async getSuggestions(@Query() query: AutocompleteDto) {
    return this.searchService.getSuggestions(query.query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get popular categories' })
  @ApiResponse({ status: 200, description: 'List of popular categories' })
  async getPopularCategories() {
    return this.searchService.getPopularCategories();
  }
}
