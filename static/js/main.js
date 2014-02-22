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
    var templateSkills = $('#template-skills').html();
    var templatePanicSkills = $('#template-panic-skills').html();

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

      initDate = data.date;
      diaries.push( data.diary );
      
      goSkills(data.diary);
    });

    // temporary go to login page on bad connection
    // should instead display a bad connection message
    socket.on('connect_failed', function(){
      window.location.replace('/moodru/login');
    });
    socket.on('disconnect', function(){
      window.location.replace('/moodru/login');
    });

    var getSortedEmotions = function(diary) {
      var emotionsList = [];
      for (var j=0; j<emotions.length; j++) {
        var emotion = emotions[j];
        var value = diary.emotions[emotion];
        if (value) {
          emotionsList.push( [ diary.emotions[emotion], emotion ] );
        }
      }
      emotionsList.sort(function(a,b) {return b[0] - a[0];});
      return emotionsList;
    };
    
    var buildDiaryEntry = function(serverDate, diary, index) {
      var emotionsList = getSortedEmotions(diary);
      for (var j=0; j<emotionsList.length; j++) {
        emotionsList[j] = emotionsList[j].join(' ');
      }
      var emotionsText = emotionsList.slice(0, 2).join(', ');
      
      var date = moment(diary.created);
      var dateAbsolute = date.toISOString();
      var dateRelative = date.from(serverDate);
      return _.template(templateDiariesEntry, {dateAbsolute: dateAbsolute, dateRelative: dateRelative, emotions: emotionsText, index: index});
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
        var r,g,b;
        if (item[0].id == 'emotion-item-joy') {
          r = 0;
          g = Math.floor(outOf255 * 0.75);
          b = 0;
        } else {
          r = outOf255;
          g = 0;
          b = 0;
        }
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
        {name: 'share', label: 'Share'},
        {name: 'panic', label: 'Panic!'}
      ];
      var htmlMenu = buildMenu(menuData);
      
      /*
      // build the user menu
      var welcome = 'Welcome ' + user.displayName + '.';
      htmlUserMenu = _.template(templateUserMenu, {welcome: welcome});
      */

      // build the diaries section
      var diaryList = '';
      var added = 0;
      for (var i=0; i<diaries.length; i++) {
        if (i == 12) { // max 12
          diaryList += templateDiariesEntryEtc;
          break;
        }
        var index = diaries.length - i - 1;
        var diary = diaries[index];
        diaryList += buildDiaryEntry(initDate, diary, index);
        added++;
      }
      var diaryCount = buildDiaryCount(diaries.length);
      htmlDiaries = _.template(templateDiaries, {diaryList: diaryList, diaryCount: diaryCount});
      
      setWrapper('home', '<h1 id="home-head">Home</h1>' + htmlDiaries + htmlMenu);
      
      for (var i=0; i<added; i++) {
        (function() { // scope
          var index = diaries.length - i - 1;
          var diary = diaries[index];
          $('#link-skills-' + index).on('click', function() {
            goSkills(diary);
          });
        })();
      }
      
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
        {name: 'submit', label: 'Submit'}
      ];
      var htmlMenu = buildMenu(menuData);

      // add all the info to the page
      setWrapper('add-card', htmlAddDiary + htmlMenu);
      
      buildSliders();
      
      // attach events
      var addDiaryForm = $('#add-diary-form');
      addDiaryForm.on('submit', function(e) {
        // validate
        var fields = addDiaryForm.serializeArray();
        var found = false;
        for (var i=0; i<fields.length; i++) {
          if (fields[i].value > 0) {
            found = true;
            break;
          }
        }
        if (!found) {
          alert('Cannot submit an empty diary card.');
          return;
        }
        
        if (!confirm('Are you sure you want to add this diary card?')) {
          return;
        }
        
        // submit
        var diaryData = {emotions: fields};
        socket.emit('diary:put', diaryData);
      });
      
      attachEventsToMenu(addDiaryForm);
    };

    var goGraphs = function() {
      // build the chart
      var htmlChart = templateChart;

      // build the menu
      var menuData = [
        {name: 'home', label: 'Home'}
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

    var goSkills = function(diary) {
      // build the skills
      var emotionsList = getSortedEmotions(diary);
      var highestEmotion = emotionsList[0].join(' ');
      
      var htmlSkills = _.template(templateSkills, {highestEmotion: highestEmotion});

      // build the menu
      var menuData = [
        {name: 'home', label: 'Home'}
      ];
      var htmlMenu = buildMenu(menuData);

      // add all the info to the page
      setWrapper('skills', htmlSkills + htmlMenu);
      
      attachEventsToMenu();
    };

    var goPanic  = function() {
      if (confirm('Are you sure?')) {
        goPanicSkills();
      }
    };
    
    var goPanicSkills = function() {
      // build the skills
      var htmlPanicSkills = templatePanicSkills;

      // build the menu
      var menuData = [
        {name: 'home', label: 'Home'}
      ];
      var htmlMenu = buildMenu(menuData);

      // add all the info to the page
      setWrapper('skills', htmlPanicSkills + htmlMenu);
      
      attachEventsToMenu();
    };
  });

});