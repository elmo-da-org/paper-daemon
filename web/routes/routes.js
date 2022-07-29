function createRoutes(app) {
    app.get('/', (req, res) => {
        res.redirect('/login')
    })
    
    app.get('/login', (req, res) => {
        res.render('login', { version: require('../../package.json').version })
    })
    
    app.get('/servers', (req, res) => {
        res.render('servers', {})
    })
    
    app.get('/server/:uuid', (req, res) => {
        res.render('server', {uuid: req.params.uuid});
    })

    
}

module.exports.createRoutes = createRoutes;