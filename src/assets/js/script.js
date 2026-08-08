(function ($) {
  // Prevent double-bind if script.js is injected more than once
  if (window.__ysHeaderScriptBound) {
    return;
  }
  window.__ysHeaderScriptBound = true;

  $(document).ready(function () {
    "use strict";

    //if you change this breakpoint in the style.css file (or _layout.scss if you use SASS), don't forget to update this value as well
    let MqL = 992;

    // HAMBURGER
    $(document).on('click', '.hamburger-menu', function(e) {
      $(this).toggleClass('open');
      $('body').toggleClass('side-menu-open');
    });

    // show cart dropdown
    $(document).on('click', '#minicart-trigger', function(e) {
      e.stopPropagation();
      $(this).siblings('.cart-box').slideToggle('400');
      $(this).siblings('.cart-box').toggleClass('show');
      $(this).parents('.mini-cart').siblings().children('.cart-box').slideUp('400');
    });
    // hide cart drop-down
    $(document).on('click', '#view-btn', function() {
      $('.cart-box').slideUp('400');
    });
    $(document).on('click', 'body', function(e) {
      $('#cart-box').slideUp('400');
    });
    $(document).on('click', '#cart-box', function(e) {
      e.stopPropagation();
    });

    // open cart overlay
    $(document).on('click', '#side-minicart-trigger', function() {
      $('.cart-overlay').show();
      $('.cart-box-overlay').show("slide", { direction: "right" }, 500);
      $("body").css({"overflow":"hidden"});
    });
    $(document).on('click', '#cart-auto-checkout', function() {
      $('.cart-overlay').show();
      $('.cart-box-overlay').show("slide", { direction: "right" }, 500);
      $("body").css({"overflow":"hidden"});
    });
    // close cart overlay
    $(document).on('click', '.cart-overlay-close', function() {
      $('.cart-overlay').hide();
      $('.cart-box-overlay').hide("slide", {direction: "right" }, 500);
      $("body").css({"overflow":"visible"});
    });
    $(document).on('click', '.cart-overlay', function() {
      $('.cart-overlay').hide();
      $('.cart-box-overlay').hide("slide", {direction: "right" }, 500);
      $("body").css({"overflow":"visible"});
    });
    
    // hide mega menu
    $(document).on('mouseover', 'body', function(e) {
      if(!checkWindowWidth()) { e.preventDefault(); }
      else { closeNav(); }
    });
    $(document).on('mouseover', '.hide_menu', function(e) {
      if(!checkWindowWidth()) { e.preventDefault(); }
      else { closeNav(); }
    });

    $(document).on('click', '.page-container', function(e) {
      if($('.cd-main-content').hasClass('nav-is-visible')) {
        closeNav();
        $('.cd-overlay').removeClass('is-visible');
      }
    });
    $(document).on('click', '.cd-primary-nav', function(e) {
      e.stopPropagation();
    });
    
    $(document).on('click', '.cd-secondary-nav', function(e) {
      e.stopPropagation();
    });
    $(document).on('mouseover', '.cd-secondary-nav', function(e) {
      e.stopPropagation();
    });
    $(document).on('mouseover', '.cd-main-header .hover-container', function(e) {
      e.stopPropagation();
    });

    // SEARCH
    $(document).on('click', '.topbar .btn-search', function(e) {
      $('.search-box').toggleClass('show');
    });
    $(document).on('click', '.search-box .search-close', function(e) {
      $('.search-box').removeClass('show');
    });

    // LIKE BUTTON
    $(document).on('click', '.product-box .product-image figcaption a', function(e) {
      $(this).toggleClass('liked');
    });

    // SIZE SELECT
    $(document).on('click', '.product-detail .product-content .sizes li a', function(e) {
      $(this).toggleClass('selected');
    });

    // PRODUCT IMAGE THUMB
    $('.product-detail .product-image ul li').delegate('img', 'click', function () {
      $('#product-image').attr('src', $(this).attr('src'));
      $('#link').attr('href', $(this).attr('src'));
    });

    //-----------------------------------------Mega Menu ------------------------------------------------------//

    let navScrollY = 0;

    function lockBodyScroll() {
      if (checkWindowWidth()) {
        return;
      }
      navScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      $('html, body').addClass('overflow-hidden');
      $('body').css('top', (-navScrollY) + 'px');
    }

    function unlockBodyScroll() {
      if (!$('body').hasClass('overflow-hidden')) {
        return;
      }
      $('html, body').removeClass('overflow-hidden');
      $('body').css('top', '');
      window.scrollTo(0, navScrollY);
    }

    //mobile - open lateral menu clicking on the menu icon
    let navToggleBusy = false;

    // Drop leftover hash from old <a href="#cd-primary-nav"> triggers
    if (window.location.hash === '#cd-primary-nav') {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }

    function openMobileNav(triggerEl) {
      if (checkWindowWidth()) {
        return;
      }
      const $trigger = triggerEl ? $(triggerEl) : $('.cd-nav-trigger').first();
      $trigger.addClass('nav-is-visible');
      lockBodyScroll();
      $('.cd-primary-nav').removeClass('nav-dismiss');
      $('.cd-primary-nav').addClass('nav-active');
      $('.cd-primary-nav').addClass('nav-is-visible');
      $('.cd-main-header').addClass('nav-is-visible');
      $('.cd-main-content').addClass('nav-is-visible');
      toggleSearch('close');
      $('.cd-overlay').addClass('is-visible');
    }

    function toggleMobileNav(triggerEl) {
      if (navToggleBusy) {
        return;
      }
      navToggleBusy = true;
      window.setTimeout(function () { navToggleBusy = false; }, 400);

      if ($('.cd-main-content').hasClass('nav-is-visible')) {
        closeNav();
        $('.cd-overlay').removeClass('is-visible');
      } else {
        openMobileNav(triggerEl);
      }
    }

    // Called from Angular after lazy-loading this script (first hamburger tap)
    window.__ysToggleMobileNav = function (triggerEl) {
      toggleMobileNav(triggerEl || null);
    };
    window.__ysOpenMobileNav = function (triggerEl) {
      if (!$('.cd-main-content').hasClass('nav-is-visible')) {
        openMobileNav(triggerEl || null);
      }
    };

    $(document).on('click', '.cd-nav-trigger',  function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleMobileNav(this);
    });

    // reset menu / in-drawer close
    $(document).on('click', '#reset-menu, .mobile-nav-close',  function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeNav();
      $('.cd-overlay').removeClass('is-visible');
      // close cart drop-down
      $('.cart-overlay-close').click();
      $('.cart-box').slideUp('400');
    });

    //open search form
    $(document).on('click', '.cd-search-trigger', function (event) {
      event.preventDefault();
      toggleSearch();
      closeNav();
    });

    //close lateral menu on mobile 
    $(document).on('swiperight', '.cd-overlay', function () {
      if($('.cd-primary-nav').hasClass('nav-is-visible')) {
        closeNav();
        $('.cd-overlay').removeClass('is-visible');
      }
    });
    $(document).on('swipeleft', '.nav-on-left .cd-overlay', function () {
      if($('.cd-primary-nav').hasClass('nav-is-visible')) {
        closeNav();
        $('.cd-overlay').removeClass('is-visible');
      }
    });
    $(document).on('click', '.cd-overlay', function () {
      closeNav();
      toggleSearch('close')
      $('.cd-overlay').removeClass('is-visible');
    });

    //prevent default clicking on direct children of .cd-primary-nav 
    $('.cd-primary-nav').children('.has-children').children('a, button').on('click', function (event) {
      event.preventDefault();
    });
    $(document).on('mouseover', '.mega-menu > a', function (e) {
      if(!checkWindowWidth()) { e.preventDefault(); }
      else {
        let selected = $(this);
        selected.addClass('selected').next('ul').removeClass('is-hidden').end().parent('.has-children').parent('ul').addClass('moves-out');
        setTimeout(() => {
          selected.parent('.has-children').siblings('.has-children').children('ul').addClass('is-hidden').end().children('a, button').removeClass('selected');
        }, 200);
        // No dim overlay on desktop mega-menu hover
        $('.cd-overlay').removeClass('is-visible');
        toggleSearch('close');
        $('.cart-box').slideUp('400');
      }
    });
    //open submenu
    $(document).on('click', '.has-children > a, .has-children > button', function (e) {
      if(!checkWindowWidth()) e.preventDefault();
      let selected = $(this);
      if(e.currentTarget.className.indexOf('has-link') == -1) {
        menuChange(selected);
      }
      toggleSearch('close');
    });
    
    $(document).on('click', '.last-sec > i', function (e) {
      if(!checkWindowWidth()) e.preventDefault();
      let selected = $(this);
      if(e.currentTarget.className.indexOf('has-link') != -1) {
        selected = $(this).parent();
      }
      menuChange(selected);
      toggleSearch('close');
    });

    function menuChange(selected) {
      if(selected.next('ul').hasClass('is-hidden')) {
        selected.addClass('selected').next('ul').removeClass('is-hidden').end().parent('.has-children').parent('ul').addClass('moves-out');
        selected.parent('.has-children').siblings('.has-children').children('ul').addClass('is-hidden').end().children('a, button').removeClass('selected');
        // Overlay only for mobile drawer / nested panels
        if (!checkWindowWidth()) {
          $('.cd-overlay').addClass('is-visible');
        }
      } else {
        selected.removeClass('selected').next('ul').addClass('is-hidden').end().parent('.has-children').parent('ul').removeClass('moves-out');
        if (!checkWindowWidth()) {
          $('.cd-overlay').removeClass('is-visible');
        }
      }
    }

    //submenu items - go back link
    $(document).on('click', '.go-back', function (e) {
      e.stopPropagation();
      $(this).parent('ul').addClass('is-hidden').parent('.has-children').parent('ul').removeClass('moves-out');
    });

    function closeNav() {
      const isDesktop = checkWindowWidth();
      $('.cd-nav-trigger').removeClass('nav-is-visible');
      $('.cd-main-header').removeClass('nav-is-visible');
      $('.cd-primary-nav').removeClass('nav-is-visible');
      $('.cd-primary-nav').removeClass('nav-active');
      // Slide animation is mobile-drawer only — on desktop it hides the top menu
      if (!isDesktop) {
        $('.cd-primary-nav').addClass('nav-dismiss');
      } else {
        $('.cd-primary-nav').removeClass('nav-dismiss');
      }
      $('.has-children ul').addClass('is-hidden');
      $('.has-children a, .has-children button').removeClass('selected');
      $('.moves-out').removeClass('moves-out');
      $('.cd-main-content').removeClass('nav-is-visible').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
        unlockBodyScroll();
      });
      $('.cd-overlay').removeClass('is-visible');
      unlockBodyScroll();
    }

    $(window).on('resize', function () {
      if (checkWindowWidth()) {
        // Leaving mobile drawer: clear slide classes so desktop mega menu works
        $('.cd-primary-nav').removeClass('nav-active nav-dismiss nav-is-visible');
        $('.cd-nav-trigger, .cd-main-header, .cd-main-content').removeClass('nav-is-visible');
        $('.cd-overlay').removeClass('is-visible');
        unlockBodyScroll();
      }
    });

    function toggleSearch(type) {
      if(type == "close") {
        //close serach 
        $('.cd-search').removeClass('is-visible');
        $('.cd-search-trigger').removeClass('search-is-visible');
        $('.cd-overlay').removeClass('search-is-visible');
      } else {
        //toggle search visibility
        $('.cd-search').toggleClass('is-visible');
        $('.cd-search-trigger').toggleClass('search-is-visible');
        $('.cd-overlay').toggleClass('search-is-visible');
        if($(window).width() > MqL && $('.cd-search').hasClass('is-visible')) $('.cd-search').find('input[type="search"]').focus();
        ($('.cd-search').hasClass('is-visible')) ? $('.cd-overlay').addClass('is-visible'): $('.cd-overlay').removeClass('is-visible');
      }
    }

    function checkWindowWidth() {
      //check window width (scrollbar included)
      let e = window,
        a = 'inner';
      if(!('innerWidth' in window)) {
        a = 'client';
        e = document.documentElement || document.body;
      }
      if(e[a + 'Width'] >= MqL) {
        return true;
      } else {
        return false;
      }
    }

  });
  
})(jQuery);