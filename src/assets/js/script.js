(function ($) {

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

    //mobile - open lateral menu clicking on the menu icon
    $(document).on('click', '.cd-nav-trigger',  function (event) {
      event.preventDefault();
      if($('.cd-main-content').hasClass('nav-is-visible')) {
        closeNav();
        $('.cd-overlay').removeClass('is-visible');
        $('body').removeClass('overflow-hidden');
      } else {
        $(this).addClass('nav-is-visible');
        $('body').addClass('overflow-hidden');
        $('.cd-primary-nav').removeClass('nav-dismiss');
      $('.cd-primary-nav').addClass('nav-active');
        $('.cd-primary-nav').addClass('nav-is-visible');
        $('.cd-main-header').addClass('nav-is-visible');
        $('.cd-main-content').addClass('nav-is-visible').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () { });
        toggleSearch('close');
        $('.cd-overlay').addClass('is-visible');
      }
    });

    // reset menu
    $(document).on('click', '#reset-menu',  function () {
      closeNav();
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
        $('.cd-overlay').addClass('is-visible');
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
        $('.cd-overlay').addClass('is-visible');
      } else {
        selected.removeClass('selected').next('ul').addClass('is-hidden').end().parent('.has-children').parent('ul').removeClass('moves-out');
        $('.cd-overlay').removeClass('is-visible');
      }
    }

    //submenu items - go back link
    $(document).on('click', '.go-back', function (e) {
      e.stopPropagation();
      $(this).parent('ul').addClass('is-hidden').parent('.has-children').parent('ul').removeClass('moves-out');
    });

    function closeNav() {
      $('.cd-nav-trigger').removeClass('nav-is-visible');
      $('.cd-main-header').removeClass('nav-is-visible');
      $('.cd-primary-nav').removeClass('nav-is-visible');
      $('.cd-primary-nav').removeClass('nav-active');
      $('.cd-primary-nav').addClass('nav-dismiss');
      $('.has-children ul').addClass('is-hidden');
      $('.has-children a, .has-children button').removeClass('selected');
      $('.moves-out').removeClass('moves-out');
      $('.cd-main-content').removeClass('nav-is-visible').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
        $('body').removeClass('overflow-hidden');
      });
      $('.cd-overlay').removeClass('is-visible');
      $('body').removeClass('overflow-hidden');
    }

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