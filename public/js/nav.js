$( "#home" ).load( "pages/home.html" );
$( "#about" ).load( "pages/about.html" );

$(".nav a").on('click', function(e) {
    e.preventDefault();

    // highlight the selected menu item
    $('.navbar-nav li.active').removeClass('active');
    var $menu = $(this).parent();
    if (!$menu.hasClass('active')) {
        $menu.addClass('active');
    }

    // only show the selected content
    $('.content').hide();
    $( $(this).attr('href') ).show();
});
