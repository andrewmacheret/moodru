google.load('visualization', '1', {packages:['corechart']});
google.setOnLoadCallback(function() {

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

    var setWrapper = function(classSuffix, content) {
      wrapper.html('<div class="wrapper-' + classSuffix + '">' + content + '</div>');
    }
    
    // set page to loading until it's ready
    setWrapper( 'loading', templateLoadingHTML );

    // connect to socket.io
    var socket = io.connect(null, {resource: 'moodru/socket.io'});

    // these arrays will be initialized during init
    var emotions = [];
    var diaries = [];
    var user = {};
    var initDate = {};

    // on a initialization:
    socket.on('init', function(data) {
      if (data.err) {
        alert('Unexpected error: ' + data.err);
        return;
      }

      emotions = data.emotions;
      diaries = data.diaries;
      user = data.user;
      initDate = data.date;
      
      goHome();
    });

    socket.on('diary:put', function(data) {
      if (data.err) {
        alert('Unexpected error: ' + data.err);
        return;
      }

      goHome();
    });

    // temporary go to login page on bad connection
    // should instead display a bad connection message
    socket.on('connect_failed', function(){
      window.location.replace('/moodru/login');
    });
    socket.on('disconnect', function(){
      window.location.replace('/moodru/login');
    });

    var buildDiaryEntry = function(serverDate, diary) {
      var emotionsList = [];
      for (var j=0; j<emotions.length; j++) {
        var emotion = emotions[j];
        var value = diary.emotions[emotion];
        if (value) {
          emotionsList.push( [ diary.emotions[emotion], emotion ] );
        }
      }
      emotionsList.sort(function(a,b) {return b[0] - a[0];});
      for (var j=0; j<emotionsList.length; j++) {
        emotionsList[j] = emotionsList[j].join(' ');
      }
      var emotionsText = emotionsList.slice(0, 2).join(', ');
      
      var date = moment(diary.created);
      var dateAbsolute = date.toISOString();
      var dateRelative = date.from(serverDate);
      return _.template(templateDiariesEntry, {dateAbsolute: dateAbsolute, dateRelative: dateRelative, emotions: emotionsText});
    };

    var buildDiaryCount = function(count) {
      var message = 'Diary Entr' + (count == 1 ? 'y' : 'ies');
      return _.template(templateDiariesCount, {count: count, message: message});
    };

    var drawChart = function() {
      var chartDiv = $('#chart')[0];
      if (!chartDiv) return;

      var data = new google.visualization.DataTable();
      data.addColumn('datetime', 'Date');
      for (var i=0; i<emotions.length; i++) {
        data.addColumn('number', emotions[i]);
      }

      data.addRows(diaries.length);
      for (var j=0; j<diaries.length; j++) {
        data.setValue(j, 0, moment(diaries[j].created).toDate());

        for (var i=0; i<emotions.length; i++) {
          data.setValue(j, i+1, diaries[j].emotions[emotions[i]]);
        }
      }

      var options = {
        //title: 'Emotions Over Time'
      };
      var chart = new google.visualization.LineChart(chartDiv);
      chart.draw(data, options);
    };

    var buildMenu = function(menuData) {
      var menuItems = '';
      for (var i=0; i<menuData.length; i++) {
        menuItems += _.template(templateMenuItem, menuData[i]);
      }
      return _.template(templateMenu, {menuItems: menuItems});
    };
    
    var attachEventsToMenu = function(form) {
      $('#go-home').on('click', function(e) {
        goHome();
      });
      $('#go-add-card').on('click', function(e) {
        goCard();
      });
      $('#go-panic').on('click', function(e) {
        goPanic();
      });
      $('#go-graphs').on('click', function(e) {
        goGraphs();
      });
      $('#go-logout').on('click', function(e) {
        goLogout();
      });
      if (form) {
        $('#go-submit').on('click', function(e) {
          form.submit();
        });
      }
    }
    
    var pad = function(str, ch, length) {
      for (var i=str.length; i < length; i++) {
        str = ch + str;
      }
      return str;
    };
    
    var buildSliders = function() {
      var updateEmotionValue = function(e, ui) {
        var item = $(ui.handle).parent().parent();
        
        var emotionAmount = item.children('.emotion-text').children('.emotion-amount');
        emotionAmount.html(pad(ui.value + '%', '&nbsp;', 4));
        
        var emotionField = item.children('.emotion-field');
        emotionField.val(ui.value);
        
        var outOf255 = Math.floor(ui.value * 255 / 100);
        var r = outOf255;
        var g = 0;
        var b = 0;
        emotionAmount.css('color', '3px solid rgb(' + r + ',' + g + ',' + b + ')');
      }
      
      $('.emotion-slider').slider({
        orientation: 'horizontal',
        min: 0,
        max: 100,
        step: 5,
        slide: updateEmotionValue,
        change: updateEmotionValue
      }).slider("value", 0);
    };
    
    var goHome = function() {
      // build the menu
      var menuData = [
        {name: 'add-card', label: 'Add Card'},
        {name: 'graphs', label: 'Graphs'},
        {name: 'panic', label: 'Panic!'},
        {name: 'logout', label: 'Logout'}
      ];
      var htmlMenu = buildMenu(menuData);
      
      /*
      // build the user menu
      var welcome = 'Welcome ' + user.displayName + '.';
      htmlUserMenu = _.template(templateUserMenu, {welcome: welcome});
      */

      // build the diaries section
      var diaryList = '';
      for (var i=0; i<diaries.length; i++) {
        if (i == 12) {
          diaryList += templateDiariesEntryEtc;
          break;
        }
        var diary = diaries[diaries.length - i - 1];
        diaryList += buildDiaryEntry(initDate, diary);
      }
      var diaryCount = buildDiaryCount(diaries.length);
      htmlDiaries = _.template(templateDiaries, {diaryList: diaryList, diaryCount: diaryCount});
      
      setWrapper('home', '<h1 id="home-head">Home</h1>' + htmlDiaries + htmlMenu);
      
      attachEventsToMenu();
    }

    var goCard = function() {
      // build the add diary section
      var emotionList = '';
      for (var i=0; i<emotions.length; i++) {
        var emotion = emotions[i];
        emotionList += _.template(templateAddDiaryEmotion, {name: emotion, label: emotion});
      }
      var htmlAddDiary = _.template(templateAddDiary, {emotionList: emotionList});

      // build the menu
      var menuData = [
        {name: 'home', label: 'Home'},
        {name: 'logout', label: 'Logout'},
        {name: 'submit', label: 'Submit'}
      ];
      var htmlMenu = buildMenu(menuData);

      // add all the info to the page
      setWrapper('add-card', htmlAddDiary + htmlMenu);
      
      buildSliders();
      
      // attach events
      var addDiaryForm = $('#add-diary-form');
      addDiaryForm.on('submit', function(e) {
        if (!confirm('Are you sure you want to add this diary card?')) {
          return;
        }
        
        var diaryData = {emotions: addDiaryForm.serializeArray()};
        socket.emit('diary:put', diaryData);
      });
      
      attachEventsToMenu(addDiaryForm);
    };

    var goGraphs = function() {
      // build the chart
      var htmlChart = templateChart;

      // build the menu
      var menuData = [
        {name: 'home', label: 'Home'},
        {name: 'logout', label: 'Logout'}
      ];
      var htmlMenu = buildMenu(menuData);

      // add all the info to the page
      setWrapper('graphs', htmlChart + htmlMenu);
      
      attachEventsToMenu();

      drawChart();
    };

    var goLogout = function() {
      window.location.replace('/moodru/logout');
    };

  });
  
  var goPanic = function() {
    // TODO
  }

});