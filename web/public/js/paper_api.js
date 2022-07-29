import axios from 'https://cdn.skypack.dev/axios';
const BASE_URL = 'http://localhost:5210/'

const PaperAPI = async function(url, next) {
    url = BASE_URL + url

    const { data } = await axios.get(
        url
    );

    next(data);
}

export {PaperAPI};

