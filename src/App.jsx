import React, { useEffect, useState } from 'react'
import Search from './components/Search'
import Spinner from './components/Spinner'
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}
// All UseState Hooks are defined here
// searchTerm - stores the search term entered by the user
// errorMessage - stores the error message when fetching movies fails
// movies - stores the list of movies fetched from the API
// trendingMovies - stores the list of trending movies fetched from the database
// isLoading - stores the loading state of the movies
// debouncedSearchTerm - stores the debounced search term
// The loadTrendingMovies function fetches the trending movies from the database
const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage,setErrorMessage] = useState('');
  const [movies, setMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  

  //Debounce the search term to prevent making too many API requests
  // by waiting for the user to stop typing for 1000ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error loading trending movies: ${error}`);
    }
  }

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
      ?`${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok) {
        throw new Error('Failed to fetch movies')
      }

      const data = await response.json();
      
      if(data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovies([]);
        return;
      }

      if(query && data.results.length > 0){
        await updateSearchCount(query, data.results[0]);
      }
      
      setMovies(data.results || []);
    } catch (error){
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies();
  }, [])

  return (
    <main>
      <div className='pattern'/>
      
      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className='text-gradient'>Movies</span>  You'll Enjoy
              Wihtout the Hassle
          </h1>

        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index +1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>All Movies</h2>

         {isLoading ? (
           <Spinner />
         ) : errorMessage ? (
           <p>{errorMessage}</p>
         ) : (
           <ul>
             {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
             ))}
           </ul>
         )

         }
        </section>
      </div>
    </main>
  )
}

export default App
 