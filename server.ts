import 'zone.js/dist/zone-node';
import { environment } from './src/environments/environment';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';

import { AppServerModule } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';

import 'localstorage-polyfill';
global['localStorage'] = localStorage;

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {

  const request = require('request');
  const server = express();
  const distFolder = join(process.cwd(), 'dist/ecommerce/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';
  const robotsAccess = "Allow"; // Allow (or) Disallow

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // sitemap
  server.use('/sitemap.xml', function (req, res) {
    // res.sendFile(join(DIST_FOLDER,'sitemap.xml'));
    request.get("https://yourstore.io/api/store_details/sitemap?store_id="+environment.store_id, function (err, response, body) {
      res.type('application/xml');
      res.send(body);
    });
  });

  // robots
  server.use('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-Agent: *\n"+robotsAccess+": /\nSitemap: https://"+environment.domain+"/sitemap.xml");
  });

  // link redirection
  server.use('/saree/kanjivaram-silk-sarees.html', function(req, res) {
    res.redirect('/category/kanjivaram-silk-sarees');
  });
  server.use('/saree/soft-silk.html', function(req, res) {
    res.redirect('/category/soft-silk');
  });
  server.use('/saree/ikat.html', function(req, res) {
    res.redirect('/category/ikat');
  });
  server.use('/saree/tussar-silk.html', function(req, res) {
    res.redirect('/category/tussar-silk-sarees');
  });
  server.use('/saree/cotton-sarees.html', function(req, res) {
    res.redirect('/category/cotton');
  });
  server.use('/saree/banaras-sarees.html', function(req, res) {
    res.redirect('/category/banaras-sarees');
  });
  server.use('/saree/linen-silk.html', function(req, res) {
    res.redirect('/category/linen-silk');
  });
  server.use('/blogs/trending-saree-blouse-designs-for-designer-sarees-and-how-to-make-them', function(req, res) {
    res.redirect('/blogs/20-saree-blouse-neck-designs-front-and-back');
  });
  server.use('/home', function(req, res) {
    res.redirect('/');
  });
  server.use('/product/beige-and-black-tussar-printed-saree-t588564-shipping-10-to-15-days-t588564', function(req, res) {
    res.redirect('/product/beige-and-black-tussar-printed-saree-t588564-t588564');
  });
  server.use('/product/beige-and-yellow-tussar-printed-saree-t588562-shipping-10-to-15-days-t588562', function(req, res) {
    res.redirect('/product/beige-and-yellow-tussar-printed-saree-t588562-t588562');
  });
  server.use('/category/5d3aba773880672656301ac6', function(req, res) {
    res.redirect('/category/view-all-six-yards');
  });
  server.use('/category/5d38185edf972007f663040e', function(req, res) {
    res.redirect('/category/traditional');
  });
  server.use('/blogs/Reliving-Kanjivaram’s-heritage-weaves', function(req, res) {
    res.redirect('/blogs/reliving-heritage-weaves-of-kanjivaram-silk-sarees');
  });
  
  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(indexHtml, { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] });
  });

  return server;
}

// Start up the Node server
function run(): void {
  const server = app();
  server.listen(environment.port, () => {
    console.log(`Node Express server listening on http://localhost:${environment.port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';