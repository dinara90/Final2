const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const fetch = require('node-fetch');



/*
 *GET/
 *HOME
*/
router.get('', async (req, res) => {
    try {
        const locals = {
            title: "NodeJs Blog",
            description: "Simple Blog created with NodeJs, Express & MongoDB."
        };

        let perPage = 9;
        let page = req.query.page || 1;

        const data = await Post.aggregate([
            { $sort: { createdAt: -1 } }
        ])
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        res.render('index', {
            posts: data, 
            locals, 
            current: page, 
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});







/*
 *GET/
 *Post: id
*/
router.get('/post/:id', async (req, res) => {

    try {        
        let slug = req.params.id;

        const data = await Post.findById({_id: slug});

        const locals = {
            title: data.title,
            description: "Simple Blog created with NodeJs, Express & MongogDB.",
        }
        console.log(data.photos);

        res.render('post', {locals, data, currentRoute: `/post/${slug}`});


    } catch (error) {
        console.log(error);
    }

});


/*
 *POST/
 *Post - searchTerm
*/
router.post('/search', async (req, res) => {
    try {
        const locals = {
            title: "Search",
            description: "Simple Blog created with NodeJs, Express & MongogDB."
        }

        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "")

        const data = await Post.find({
            $or: [
                {title: { $regex: new RegExp(searchNoSpecialChar, 'i')}},
                {body: { $regex: new RegExp(searchNoSpecialChar, 'i')}}
            ]
        })        
        res.render('search', {
            data,
            locals
        });
    } catch (error) {
        console.log(error);
    }

});


// router.get('/about', (req, res) => {
//     res.render('about', {
//         currentRoute: '/about'
//     })
// })


function prepareStockData(data) {
    const timeSeries = data["Time Series (Daily)"];
    const dates = Object.keys(timeSeries).sort().reverse();
    const prices = dates.map(date => timeSeries[date]["4. close"]);

    return {
        dates,
        prices
    };
}


router.get('/stocks', async (req, res) => {
    const apiKey = 'S1OM69F1W2649B9T';
    const symbol = 'IBM';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Подготовка данных для передачи в EJS
    const stockData = prepareStockData(data);

    res.render('stocks', { 
        stockData,
        currentRoute: '/stocks'
    });
});

function prepareNewsData(data) {
    return data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt
    }));
}

router.get('/news', async (req, res) => {
    const apiKey = '5f85f626830a47098f45d9597fd265e7';
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Подготовка данных для передачи в EJS
    const newsData = prepareNewsData(data);

    res.render('news', { 
        newsData,
        currentRoute: '/news'
    });
});





// function insertPostData(){
//     Post.insertMany([
//         {
//             title: "Building a Blog",
//             body: "This is the body text"
//         },
//         {
//             title: "Bui",
//             body: "This is the something"
//         },
//         {
//             title: "Blog",
//             body: "Some"
//         },
//     ])
// }

// insertPostData();


async function getTopCryptos(limit = 10) {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            current_price: coin.current_price,
            market_cap: coin.market_cap,
            price_change_percentage_24h: coin.price_change_percentage_24h
        }));
    } catch (error) {
        console.error("Ошибка при получении данных о криптовалютах:", error);
        return [];
    }
}

router.get('/cryptos', async (req, res) => {
    const cryptosData = await getTopCryptos();
    res.render('cryptos', { 
        cryptosData,
        currentRoute: '/cryptos'
    });
});




module.exports = router;