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
    var templateDiariesCount = $('#template-diaries-count').html();
    var templateChart = $('#template-chart').html();
    var templateMenu = $('#template-button-menu').html();
    var templateMenuItem = $('#template-button-menu-item').html();

    // set page to loading until it's ready
    wrapper.html( templateLoadingHTML );

    // connect to socket.io
    var socket = io.connect(null, {resource: 'moodru/socket.io'});

    // these arrays will be initialized during init
    var emotions = [];
    var diaries = [];

    // on a initialization:
    socket.on('init', function(data) {
      if (data.err) {
        alert('Unexpected error: ' + data.err);
        return;
      }

      emotions = data.emotions;
      diaries = data.diaries;
      goCard();

      /*
      // build the user menu
      var welcome = 'Welcome ' + data.user.displayName + '.';
      htmlUserMenu = _.template(templateUserMenu, {welcome: welcome});
      */

      /*
      // build the diaries section
      diaries = data.diaries;
      var diaryList = '';
      for (var i=0; i<diaries.length; i++) {
        var diary = diaries[i];
        diaryList += buildDiaryEntry(data.date, diary);
      }
      var diaryCount = buildDiaryCount(diaries.length);
      htmlDiaries = _.template(templateDiaries, {diaryList: diaryList, diaryCount: diaryCount});
      */
    });

    socket.on('diary:put', function(data) {
      if (data.err) {
        alert('Unexpected error: ' + data.err);
        return;
      }

      var diariesList = $('#diaries-list');
      if (diariesList) {
        var htmlDiaryEnty = buildDiaryEntry(data.date, data.diary);
        $('#diaries-list').html( $('#diaries-list').html() + htmlDiaryEnty );

        var count = Number($('#diaries-count-num').html()) + 1;
        var diaryCount = buildDiaryCount(count);
        $('#diaries-count').html(diaryCount);

        diaries.push(data.diary);
      }

      goGraphs();
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
          emotionsList.push( diary.emotions[emotion] + ' ' + emotion );
        }
      }
      var date = moment(diary.created);
      var dateAbsolute = date.toISOString();
      var dateRelative = date.from(serverDate);
      return _.template(templateDiariesEntry, {dateAbsolute: dateAbsolute, dateRelative: dateRelative, emotions: emotionsList.join(', ')});
    };

    var buildDiaryCount = function(count) {
      var message = 'diary entr' + (count == 1 ? 'y' : 'ies') + '.';
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
        {name: 'graphs', label: 'Graphs'},
        {name: 'skills', label: 'Skills'},
        {name: 'logout', label: 'Logout'},
        {name: 'submit', label: 'Submit'}
      ];
      var htmlMenu = buildMenu(menuData);

      var updateEmotionValue = function(e, ui) {
        var emotionText = $(ui.handle).parent().parent().children('.emotion-text');
        emotionText.html(ui.value);
        var outOf255 = Math.floor(ui.value * 255 / 100);
        var r = 255;
        var g = outOf255;
        var b = outOf255;
        emotionText.css('background-color', 'rgb(' + r + ',' + g + ',' + b + ')');
      }
      
      // add all the info to the page
      wrapper.html(htmlAddDiary + htmlMenu);
      $('.emotion-slider').slider({
        orientation: 'horizontal',
        min: 0,
        max: 100,
        value: 50,
        slide: updateEmotionValue,
        change: updateEmotionValue
      });

      // attach events
      var addDiaryForm = $('#add-diary-form');
      addDiaryForm.on('submit', function(e) {
        var diaryData = {emotions: addDiaryForm.serializeArray()};
        for (var i=0; i<diaryData.emotions.length; i++) {
          if (diaryData.emotions[i].value === '') {
            alert('Please fill in the entire card before submitting.');
            return;
          }
        }
        socket.emit('diary:put', diaryData);
      });
      $('#add-diary-form input[type=number]').on('change', function(e) {
        //alert('min=' + this.min ' max=' + this.max + ' value=' + this.value + ' cmpr=' + (this.value > this.max));
        var value = Number(this.value);
        var min = Number(this.min);
        var max = Number(this.max);
        if (value < min) value = min;
        if (value > max) value = max;
        this.value = value;
      });
      $('#go-submit').on('click', function(e) {
        addDiaryForm.submit();
      });
      $('#go-graphs').on('click', function(e) {
        goGraphs();
      });
      $('#go-logout').on('click', function(e) {
        goLogout();
      });
    };

    var goGraphs = function() {
      // build the chart
      var htmlChart = templateChart;

      // build the menu
      var menuData = [
        {name: 'logout', label: 'Logout'},
        {name: 'skills', label: 'Skills'},
        {name: 'card', label: 'Add Card'}
      ];
      var htmlMenu = buildMenu(menuData);

      // add all the info to the page
      wrapper.html(htmlChart + htmlMenu);

      $('#go-card').on('click', function(e) {
        goCard();
      });
      $('#go-logout').on('click', function(e) {
        goLogout();
      });

      drawChart();
    };

    var goLogout = function() {
      window.location.replace('/moodru/logout');
    };

  });

});