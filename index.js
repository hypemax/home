
        // Consts
        const apikey = "e950e51d5d49e85f7c2f17f01eb23ba3";
        const apiEndpoint = "https://api.themoviedb.org/3";
        const imgPath = "https://image.tmdb.org/t/p/original";

        const apiPaths = {
            fetchAllCategories: `${apiEndpoint}/genre/movie/list?api_key=${apikey}&language=pt-BR`,
            fetchMoviesList: (id) => `${apiEndpoint}/discover/movie?api_key=${apikey}&with_genres=${id}&language=pt-BR`,
            fetchTrending: `${apiEndpoint}/trending/movie/week?api_key=${apikey}&language=pt-BR`,
            searchMovies: (query) => `${apiEndpoint}/search/movie?api_key=${apikey}&query=${query}&language=pt-BR`,
            fetchMovieDetails: (id) => `${apiEndpoint}/movie/${id}?api_key=${apikey}&language=pt-BR&append_to_response=videos`
        }
        
        let isSearching = false;

        // Boots up the app
        function init() {
            isSearching = false;
            setupSearch();
            fetchTrendingMovies();
            fetchAndBuildAllSections();
            setupDownloadButton();
            setupModal();
        }

        function setupSearch() {
            const searchBox = document.getElementById('search-box');
            const searchIcon = document.getElementById('search-icon');
            const searchInput = document.getElementById('search-input');

            searchIcon.addEventListener('click', () => {
                searchBox.classList.add('active');
                searchInput.focus();
            });

            searchInput.addEventListener('blur', () => {
                if(searchInput.value === '') {
                    searchBox.classList.remove('active');
                    if (isSearching) {
                        restoreHomePage();
                    }
                }
            });

            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        executeSearch(query);
                    } else {
                        restoreHomePage();
                    }
                }
            });
        }
        
        function restoreHomePage() {
            isSearching = false;
            const moviesCont = document.getElementById('movies-cont');
            const bannerSection = document.getElementById('banner-section');
            moviesCont.innerHTML = '';
            bannerSection.style.display = 'flex';
            fetchTrendingMovies();
            fetchAndBuildAllSections();
        }

        function executeSearch(query) {
            isSearching = true;
            const bannerSection = document.getElementById('banner-section');
            bannerSection.style.display = 'none';

            fetch(apiPaths.searchMovies(query))
                .then(res => res.json())
                .then(res => {
                    const movies = res.results;
                    buildSearchResults(movies, query);
                })
                .catch(err => console.error("Erro na busca:", err));
        }

        function buildSearchResults(list, query) {
            const moviesCont = document.getElementById('movies-cont');
            moviesCont.innerHTML = ''; // Clear previous content

            if (!list || list.length === 0) {
                moviesCont.innerHTML = `<h2 class="movie-section-heading" style="padding-top: 80px;">Nenhum resultado encontrado para: "${query}"</h2>`;
                return;
            }

            const moviesListHTML = list.map(item => {
                if (!item.backdrop_path) return '';
                return `
                <div class="movie-item" onclick="openMovieDetailsModal(${item.id})">
                    <img class="movie-item-img" src="${imgPath}${item.backdrop_path}" alt="${item.title || item.name}" />
                </div>`;
            }).join('');

            const searchSectionHTML = `
                <h2 class="movie-section-heading">Resultados para: "${query}"</h2>
                <div class="search-results-grid">
                    ${moviesListHTML}
                </div>
            `;

            moviesCont.innerHTML = searchSectionHTML;
        }


        function fetchTrendingMovies() {
            fetch(apiPaths.fetchTrending)
                .then(res => res.json())
                .then(res => {
                    const trendingMovies = res.results;
                    if (!trendingMovies || trendingMovies.length === 0) return;
                    const randomIndex = Math.floor(Math.random() * trendingMovies.length);
                    const randomMovie = trendingMovies[randomIndex];
                    return fetch(apiPaths.fetchMovieDetails(randomMovie.id));
                })
                .then(res => res.json())
                .then(movieWithDetails => {
                     if (isSearching) return;
                     buildBannerSection(movieWithDetails);
                })
                .catch(err => {
                    console.error("Erro ao buscar filmes em alta:", err);
                });
        }

        function buildBannerSection(movie) {
            const bannerCont = document.getElementById('banner-section');
            if (!movie || !movie.backdrop_path) return;
            
            bannerCont.style.backgroundImage = `url('${imgPath}${movie.backdrop_path}')`;

            const div = document.createElement('div');
            const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
            const videos = movie.videos?.results || [];
            const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.type === 'Teaser' && v.site === 'YouTube') || videos[0];
            const watchAction = trailer ? `window.open('https://www.youtube.com/watch?v=${trailer.key}', '_blank')` : `alert('Trailer indisponível')`;

            div.innerHTML = `
                    <h2 class="banner__title">${movie.title || movie.name}</h2>
                    <p class="banner__info">Lançamento - ${releaseYear} </p>
                    <p class="banner__overview">${movie.overview && movie.overview.length > 200 ? movie.overview.slice(0, 200).trim() + '...' : movie.overview}</p>
                    <div class="action-buttons-cont">
                        <button class="action-button" onclick="${watchAction}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 2.69127C4 1.93067 4.81547 1.44851 5.48192 1.81506L22.4069 11.1238C23.0977 11.5037 23.0977 12.4963 22.4069 12.8762L5.48192 22.1849C4.81546 22.5515 4 22.0693 4 21.3087V2.69127Z"></path></svg>
                            &nbsp;&nbsp; Assistir
                        </button>
                        <button class="action-button" onclick="openMovieDetailsModal(${movie.id})">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM13 10V18H11V10H13ZM12 8.5C12.8284 8.5 13.5 7.82843 13.5 7C13.5 6.17157 12.8284 5.5 12 5.5C11.1716 5.5 10.5 6.17157 10.5 7C10.5 7.82843 11.1716 8.5 12 8.5Z"></path></svg>
                            &nbsp;&nbsp; Mais informações
                        </button>
                    </div>
                `;
            div.className = "banner-content container";

            const existingBannerContent = bannerCont.querySelector('.banner-content');
            if (existingBannerContent) {
                bannerCont.removeChild(existingBannerContent);
            }
            bannerCont.append(div);
        }

        function fetchAndBuildAllSections() {
            const moviesCont = document.getElementById('movies-cont');
            moviesCont.innerHTML = ''; // Clear for fresh sections
            fetch(apiPaths.fetchAllCategories)
                .then(res => res.json())
                .then(res => {
                    const categories = res.genres;
                    if (Array.isArray(categories) && categories.length) {
                        categories.slice(0, 10).forEach(category => {
                            fetchAndbuildMovieSection(
                                apiPaths.fetchMoviesList(category.id),
                                category.name
                            );
                        });
                    }
                })
                .catch(err => console.error("Erro ao buscar categorias:", err));
        }

        function fetchAndbuildMovieSection(fetchUrl, categoryName) {
            return fetch(fetchUrl)
                .then(res => res.json())
                .then(res => {
                    if (isSearching) return; // Don't build if we're in search mode
                    const movies = res.results;
                    if (Array.isArray(movies) && movies.length) {
                        buildMoviesSection(movies, categoryName);
                    }
                    return movies;
                })
                .catch(err => console.error(`Erro ao buscar a categoria ${categoryName}:`, err))
        }

        function buildMoviesSection(list, categoryName) {
            const moviesCont = document.getElementById('movies-cont');

            const moviesListHTML = list.map(item => {
                if (!item.backdrop_path) return '';
                return `
                <div class="movie-item" onclick="openMovieDetailsModal(${item.id})">
                    <img class="movie-item-img" src="${imgPath}${item.backdrop_path}" alt="${item.title || item.name}" />
                </div>`;
            }).join('');

            const moviesSectionHTML = `
                <h2 class="movie-section-heading">${categoryName} <span class="explore-nudge">Explorar</span></h2>
                <div class="movies-row">
                    ${moviesListHTML}
                </div>
            `;

            const div = document.createElement('div');
            div.className = "movies-section";
            div.innerHTML = moviesSectionHTML;

            moviesCont.append(div);
        }

        // --- Modal Logic ---
        function setupModal() {
            const modal = document.getElementById('movie-modal');
            modal.addEventListener('click', (event) => {
                // Close modal if overlay is clicked
                if (event.target === modal) {
                    closeMovieDetailsModal();
                }
            });
        }

        function openMovieDetailsModal(movieId) {
            fetch(apiPaths.fetchMovieDetails(movieId))
                .then(res => res.json())
                .then(movie => {
                    const modal = document.getElementById('movie-modal');
                    const videos = movie.videos?.results || [];
                    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.type === 'Teaser' && v.site === 'YouTube') || videos[0];
                    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
                    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
                    
                    let videoPlayerHTML = `<img src="${imgPath}${movie.backdrop_path}" style="width:100%; height:100%; object-fit:cover;" alt="${movie.title}">`;
                    if (trailer) {
                        videoPlayerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&rel=0&iv_load_policy=3&modestbranding=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
                    }
                    
                    const watchAction = trailer ? `window.open('https://www.youtube.com/watch?v=${trailer.key}', '_blank')` : `alert('Trailer indisponível')`;

                    modal.innerHTML = `
                        <div class="modal-content">
                            <button class="modal-close-btn" onclick="closeMovieDetailsModal()">&times;</button>
                            <div class="modal-video-container">
                                ${videoPlayerHTML}
                            </div>
                            <div class="modal-details-container">
                                <h2>${movie.title}</h2>
                                <div class="modal-details-info">
                                    <span>Lançamento: ${releaseYear}</span>
                                    <span>Avaliação: ${rating} / 10</span>
                                </div>
                                <p>${movie.overview}</p>
                                <button class="action-button modal-watch-btn" onclick="${watchAction}">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 2.69127C4 1.93067 4.81547 1.44851 5.48192 1.81506L22.4069 11.1238C23.0977 11.5037 23.0977 12.4963 22.4069 12.8762L5.48192 22.1849C4.81546 22.5515 4 22.0693 4 21.3087V2.69127Z"></path></svg>
                                    &nbsp;&nbsp; Assistir Trailer
                                </button>
                            </div>
                        </div>
                    `;

                    modal.classList.add('visible');
                    document.body.classList.add('modal-open');
                })
                .catch(err => console.error('Erro ao buscar detalhes do filme:', err));
        }

        function closeMovieDetailsModal() {
            const modal = document.getElementById('movie-modal');
            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
            // Clear content to stop video playback
            modal.innerHTML = '';
        }

        function setupDownloadButton() {
            const downloadBtn = document.getElementById('download-button');
            downloadBtn.addEventListener('click', () => {
                const zip = new JSZip();

                const cssCode = document.querySelector('style').textContent;
                zip.file("index.css", cssCode);

                const jsCode = document.getElementById('main-script').textContent;
                zip.file("index.js", jsCode);

                const clonedDoc = document.cloneNode(true);
                clonedDoc.querySelector('style').remove();
                clonedDoc.querySelector('#main-script').remove();
                clonedDoc.querySelector('script[src*="jszip"]').remove();
                clonedDoc.querySelector('#download-button').remove();
                
                const linkCss = clonedDoc.createElement('link');
                linkCss.rel = 'stylesheet';
                linkCss.href = 'index.css';
                clonedDoc.head.appendChild(linkCss);

                const scriptJs = clonedDoc.createElement('script');
                scriptJs.src = 'index.js';
                scriptJs.defer = true;
                clonedDoc.body.appendChild(scriptJs);
                
                const htmlCode = '<!DOCTYPE html>\n' + clonedDoc.documentElement.outerHTML;
                zip.file("index.html", htmlCode);

                zip.file("README_FAVICON.txt", "O arquivo favicon.ico original não pôde ser incluído no ZIP por limitações técnicas. Por favor, use o seu arquivo original que você enviou.");

                zip.generateAsync({ type: "blob" })
                    .then(function(content) {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(content);
                        link.download = "netflix-clone-files.zip";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });
            });
        }

        window.addEventListener('load', function() {
            init();
            window.addEventListener('scroll', function() {
                const header = document.getElementById('header');
                if (window.scrollY > 5 || document.querySelector('.search-box.active')) {
                    header.classList.add('black-bg');
                } else {
                    header.classList.remove('black-bg');
                }
            })
        })
    