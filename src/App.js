import { useEffect, useState, useRef } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "6a8a69de";

export default function App() {
  const [movies, setMovies] = useState([]);  

  const [watched, setWatched] = useState([]);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  function handelSelectMovie(id){
    setSelectedId(selectedId => id === selectedId ? null : id);
  }

  function onCloseMovie(){
    setSelectedId(null);
  }

  function handleAddWatched(movie){
    setWatched((Watched) => [...watched, movie])
  }

  function handleDeleteWatched(id){
    setWatched( watched => watched.filter(movie => movie.imdbID !== id))
  }



  useEffect(function(){
    const controller = new AbortController();
    async function fetchMovies(){

    try{
      setError('');
      setIsLoading(true);
      const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,{signal: controller.signal});
      if(!res.ok) 
        {throw new Error ('something went wrong with movie fetching');}
      const data = await res.json();
      if(data.Response === 'False')
        {throw new Error("movie not found");}
      console.log(data);
      setMovies(data.Search); 
    }catch(err){
      if(err.name !== "AbortError"){
      setError(err.message);}
    }finally{
      setIsLoading(false);
    }
  }
    if(query.length < 3){
      setMovies([]);
      setError('');
      return;
    }
    onCloseMovie();
    fetchMovies();
    return function(){
      controller.abort();
    }
  }, [query]);

  return (
    <>
      <Navbar movies={movies} query={query} setQuery={setQuery} />
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading &&  !error && <MoviesList movies={movies} onSelectMovie={handelSelectMovie} />} 
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          { selectedId ? <MovieDetails selectedId={selectedId} onCloseMovie={onCloseMovie} key={selectedId} onAddWatched = {handleAddWatched} watched = {watched} /> :
          <>
          <WatchedSummary watched={watched} />
          <WatchedList watched={watched} onDeleteWatched ={handleDeleteWatched}/>
          </>
          }
        </Box>
      </Main>
    </>
  );
}

function Loader(){
  return(
    <p className="loader">Loading...</p>
  )
}

function ErrorMessage({message}){
  return(
  <p className="error">{message}</p>
)
}

function Navbar({movies, query , setQuery}){
  const inputEl =useRef(null);

  useEffect(function(){
    inputEl.current.focus();
  },[]) 

  return (
    <nav className="nav-bar">
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref = {inputEl}
    />
    <p className="num-results">
      Found <strong>{movies.length ? movies.length : 0 }</strong> results
    </p>
  </nav>
  );
}

function MovieDetails({onCloseMovie, selectedId, onAddWatched, watched}){
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const {Title: title, Year: year, Poster: poster, Runtime: runtime, imdbRating, Plot: plot, Released: released, Actors: actors, Director: director, Genre: genre,} = movie;
  const isWatched = watched.map( movie => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(movie => movie.imdbID === selectedId)?.userRating;

  function handleAdd(){
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    }
     

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(
    function(){
      function callback(e){
        if(e.code === "Escape"){
          onCloseMovie();
        }
      };
      document.addEventListener("keydown", callback);
      return function(){
        document.removeEventListener("keydown", callback);
      };
  }, [onCloseMovie]);

  useEffect(function(){
    async function  getMoviesDetails(){
      setIsLoading(true);
      const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`);
      const data = await res.json();
      setMovie(data);
      setIsLoading(false)
    }
    getMoviesDetails();
  }, [selectedId]);

  useEffect( function(){
    if (!title) return;
    document.title = `movie | ${title}`

    return function(){
      document.title = 'UsePopcorn';
    }
  }, [title] );

  return(
    <div className = "details">
      {isLoading ? <Loader /> : <>
      <header>
        <button className="btn-back" onClick={onCloseMovie}> &larr; </button>
        <img src={poster} alt={`poster of ${title} movie`} />
        <div className="details-overview">
          <h2>{title}</h2>
          <p>{released} &bull; {runtime} </p>
          <p>{genre}</p>
          <p><span>⭐️</span>{imdbRating} IMBD rating</p>
        </div>
      </header>
      <section>
        <div className="rating">
        {!isWatched ? 
          <>
          <StarRating maxRating={10} size={24} onSetRating = {setUserRating} />
          { userRating > 0 && ( <button className="btn-add" onClick={handleAdd}> + Add to list</button> ) }
          </> : <p>You rated this movie {watchedUserRating} <span>⭐️</span> </p>
          }
        </div>
        <p><em>{plot}</em></p>
        <p>Staring {actors}</p>
        <p>Directed by {director}</p>
      </section>
      </>}
    </div>
  )
}

function Main({children}){
  return (
    <main className="main">
      {children}
    </main>
  );
}

function Box({children}){
  const [isOpen, setIsOpen] = useState(true);
  return(
    <div className="box">
      <button
            className="btn-toggle"
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? "–" : "+"}
          </button>
          {isOpen && children}
    </div>
  );
}

function  MoviesList({movies, onSelectMovie}){
  return(
            <ul className="list list-movies">
              {movies?.map((movie) => (
                <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie}/>
              ))}
            </ul>
  );
}

function Movie({movie, onSelectMovie}){
  return(
    <li onClick={()=> onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  )
}

function WatchedSummary({watched}){
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return(
    <div className="summary">
        <h2>Movies you watched</h2>
        <div>
          <p>
            <span>#️⃣</span>
            <span>{watched.length} movies</span>
          </p>
          <p>
            <span>⭐️</span>
            <span>{avgImdbRating.toFixed(2)}</span>
          </p>
          <p>
            <span>🌟</span>
            <span>{avgUserRating.toFixed(2)}</span>
          </p>
          <p>
            <span>⏳</span>
            <span>{avgRuntime} min</span>
          </p>
        </div>
      </div>
  );
}

function WatchedList({watched, onDeleteWatched}){
  return(
    <ul className="list">
        {watched.map((movie) => (
          <li key={movie.imdbID}>
            <img src={movie.poster} alt={`${movie.title} poster`} />
            <h3>{movie.title}</h3>
            <div>
              <p>
                <span>⭐️</span>
                <span>{movie.imdbRating}</span>
              </p>
              <p>
                <span>🌟</span>
                <span>{movie.userRating}</span>
              </p>
              <p>
                <span>⏳</span>
                <span>{movie.runtime} min</span>
              </p>
              <button className="btn-delete" onClick={() => onDeleteWatched(movie.imdbID)}> x </button>
            </div>
          </li>
        ))}
      </ul>
  );
}