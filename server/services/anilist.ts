import axios from "axios";

// AniList GraphQL API endpoint
const ANILIST_API_URL = "https://graphql.anilist.co";

// Interface for AniList anime search result
interface AniListAnime {
  id: number; // AniList ID for reference
  title: {
    romaji: string; // Romanized title
    english?: string; // English title if available
    native: string; // Native language title
  };
  description?: string; // Anime synopsis
  coverImage: {
    extraLarge: string; // High resolution cover image
    large: string; // Standard cover image
    medium: string; // Thumbnail cover image
  };
  bannerImage?: string; // Banner image for hero sections
  genres: string[]; // Array of genre strings
  episodes?: number; // Number of episodes
  startDate: {
    year?: number; // Release year
    month?: number; // Release month
    day?: number; // Release day
  };
  endDate: {
    year?: number; // End year if completed
    month?: number; // End month
    day?: number; // End day
  };
  season?: string; // Anime season (WINTER, SPRING, SUMMER, FALL)
  seasonYear?: number; // Year of the season
  status: string; // FINISHED, RELEASING, NOT_YET_RELEASED, etc.
  studios: {
    nodes: Array<{
      name: string; // Studio name
      isAnimationStudio: boolean; // Whether it's an animation studio
    }>;
  };
  averageScore?: number; // Average score out of 100
  popularity: number; // Popularity ranking on AniList
  favourites: number; // Number of users who favorited
}

// GraphQL query for searching anime
const SEARCH_ANIME_QUERY = `
query SearchAnime($search: String!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      genres
      episodes
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      status
      studios {
        nodes {
          name
          isAnimationStudio
        }
      }
      averageScore
      popularity
      favourites
    }
  }
}
`;

// GraphQL query for getting anime by ID
const GET_ANIME_BY_ID_QUERY = `
query GetAnimeById($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    description
    coverImage {
      extraLarge
      large
      medium
    }
    bannerImage
    genres
    episodes
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    season
    seasonYear
    status
    studios {
      nodes {
        name
        isAnimationStudio
      }
    }
    averageScore
    popularity
    favourites
  }
}
`;

// Service class for AniList API integration
export class AniListService {
  private apiUrl = ANILIST_API_URL;
  private axiosInstance;

  constructor() {
    // Create axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`AniList API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('AniList API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`AniList API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('AniList API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Search anime by title with pagination
  async searchAnime(searchTerm: string, page: number = 1, perPage: number = 25): Promise<{
    anime: AniListAnime[];
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
      perPage: number;
    };
  }> {
    try {
      const response = await this.axiosInstance.post('', {
        query: SEARCH_ANIME_QUERY,
        variables: {
          search: searchTerm,
          page,
          perPage,
        },
      });

      if (response.data.errors) {
        throw new Error(`AniList API Error: ${response.data.errors[0].message}`);
      }

      const pageData = response.data.data.Page;
      return {
        anime: pageData.media,
        pageInfo: pageData.pageInfo,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded. Please wait before making more requests.");
        } else if (error.response?.status >= 500) {
          throw new Error("AniList service is currently unavailable. Please try again later.");
        } else if (error.code === 'ECONNABORTED') {
          throw new Error("Request timeout. Please check your connection and try again.");
        }
      }
      throw new Error(`Failed to search anime: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get anime details by AniList ID
  async getAnimeById(anilistId: number): Promise<AniListAnime> {
    try {
      const response = await this.axiosInstance.post('', {
        query: GET_ANIME_BY_ID_QUERY,
        variables: {
          id: anilistId,
        },
      });

      if (response.data.errors) {
        throw new Error(`AniList API Error: ${response.data.errors[0].message}`);
      }

      const anime = response.data.data.Media;
      if (!anime) {
        throw new Error(`Anime with ID ${anilistId} not found`);
      }

      return anime;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded. Please wait before making more requests.");
        } else if (error.response?.status >= 500) {
          throw new Error("AniList service is currently unavailable. Please try again later.");
        } else if (error.code === 'ECONNABORTED') {
          throw new Error("Request timeout. Please check your connection and try again.");
        }
      }
      throw new Error(`Failed to fetch anime: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get popular anime with filters
  async getPopularAnime(
    season?: string, 
    year?: number, 
    genre?: string, 
    page: number = 1, 
    perPage: number = 25
  ): Promise<{
    anime: AniListAnime[];
    pageInfo: any;
  }> {
    const query = `
      query GetPopularAnime($season: MediaSeason, $year: Int, $genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, sort: POPULARITY_DESC, season: $season, seasonYear: $year, genre: $genre) {
            id
            title {
              romaji
              english
              native
            }
            description
            coverImage {
              extraLarge
              large
              medium
            }
            bannerImage
            genres
            episodes
            startDate {
              year
              month
              day
            }
            season
            seasonYear
            status
            studios {
              nodes {
                name
                isAnimationStudio
              }
            }
            averageScore
            popularity
            favourites
          }
        }
      }
    `;

    try {
      const response = await this.axiosInstance.post('', {
        query,
        variables: {
          season: season?.toUpperCase(),
          year,
          genre,
          page,
          perPage,
        },
      });

      if (response.data.errors) {
        throw new Error(`AniList API Error: ${response.data.errors[0].message}`);
      }

      const pageData = response.data.data.Page;
      return {
        anime: pageData.media,
        pageInfo: pageData.pageInfo,
      };
    } catch (error) {
      throw new Error(`Failed to fetch popular anime: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert AniList anime data to our database format
  convertToAnimeData(anilistAnime: AniListAnime) {
    // Get primary title (prefer English, fallback to Romaji)
    const title = anilistAnime.title.english || anilistAnime.title.romaji;
    
    // Get primary studio (first animation studio)
    const primaryStudio = anilistAnime.studios.nodes.find(studio => studio.isAnimationStudio)?.name || 
                         anilistAnime.studios.nodes[0]?.name;

    // Calculate release year
    const year = anilistAnime.startDate.year || anilistAnime.seasonYear;

    // Convert AniList score (0-100) to our rating system (0-10)
    const rating = anilistAnime.averageScore ? Math.round(anilistAnime.averageScore / 10) : null;

    return {
      anilistId: anilistAnime.id,
      title,
      description: anilistAnime.description?.replace(/<[^>]*>/g, ''), // Strip HTML tags
      coverImageUrl: anilistAnime.coverImage.extraLarge,
      bannerImageUrl: anilistAnime.bannerImage,
      rating,
      episodeCount: anilistAnime.episodes,
      year,
      metadata: {
        titles: anilistAnime.title,
        genres: anilistAnime.genres,
        status: anilistAnime.status,
        season: anilistAnime.season,
        seasonYear: anilistAnime.seasonYear,
        studios: anilistAnime.studios.nodes,
        averageScore: anilistAnime.averageScore,
        popularity: anilistAnime.popularity,
        favourites: anilistAnime.favourites,
        startDate: anilistAnime.startDate,
        endDate: anilistAnime.endDate,
      },
    };
  }
}

// Export service instance
export const aniListService = new AniListService();
