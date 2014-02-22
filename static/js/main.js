  $(function() {

    // load the wrapper and templates
    var wrapper = $('#wrapper');
    var templateLoadingHTML = $('#template-loading').html();
    var templateUserMenu = $('#template-user-menu').html();
    var templateAddDiary = $('#template-add-diary').html();
    var templateAddDiaryEmotion = $('#template-add-diary-emotion').html();
    var templateDiaries = $('#template-diaries').html();
    var templateDiariesEntry = $('#template-diaries-entry').html();
    var templateDiariesEntryEtc = $('#template-diaries-entry-etc').html();
    var templateDiariesCount = $('#template-diaries-count').html();
    var templateChart = $('#template-chart').html();
    var templateMenu = $('#template-button-menu').html();
    var templateMenuItem = $('#template-button-menu-item').html();
    var templateSkills = $('#template-skills').html();
    var templatePanicSkills = $('#template-panic-skills').html();

    var setWrapper = function(classSuffix, content) {
      wrapper.html('<div class="wrapper-' + classSuffix + '">' + content + '</div>');
    }
    
    // set page to loading until it's ready
    setWrapper( 'loading', templateLoadingHTML );

    // connect to socket.io
    var socket = io.connect(null, {resource: 'hubby/socket.io'});

    // these arrays will be initialized during init
    //var emotions = [];
    //var diaries = [];
    //var user = {};
    //var initDate = {};

    // on an initialization:
    socket.on('init', function(data) {
      if (data.err) {
        alert('Unexpected error: ' + data.err);
        return;
      }

      //emotions = data.emotions;
      //diaries = data.diaries;
      //user = data.user;
      //initDate = data.date;
      
      goHome();
    });

    //socket.on('diary:put', function(data) {
    //  if (data.err) {
    //    alert('Unexpected error: ' + data.err);
    //    return;
    //  }
    //
    //  initDate = data.date;
    //  diaries.push( data.diary );
    //  
    //  goSkills(data.diary);
    //});

    // temporary go to login page on bad connection
    // should instead display a bad connection message
    socket.on('connect_failed', function(){
      window.location.replace('/hubby/login');
    });
    socket.on('disconnect', function(){
      window.location.replace('/hubby/login');
    });

    //var buildDiaryCount = function(count) {
    //  var message = 'Diary Entr' + (count == 1 ? 'y' : 'ies');
    //  return _.template(templateDiariesCount, {count: count, message: message});
    //};

    var goHome = function() {
      setWrapper('home', '<h1 id="home-head">Home</h1>');
    }

    var goLogout = function() {
      window.location.replace('/hubby/logout');
    };

  });
