// console.log(extent);

var partialConfig = getData();
console.log(getData())

var config = {
  title: 'Chart title',
  description: 'Chart description',
  data: partialConfig.data,
  extent: partialConfig.extent,
  comments: partialConfig.comments,
  clickHandler: function() {
    var partialConfig = getData();
    chart.update(partialConfig.data, partialConfig.extent, partialConfig.comments);
  }
}

var chart = LineChart.getInstance(config)
  .renderTo('#lineChart');

function getData() {
  var data = [];

  var date = moment(Date.now());
  var value = (Math.random() - 0.5) * 100;

  data.push({
    date: date.valueOf(),
    value: value
  });

  for (var i = 0; i < 16; i ++) {
    date = date.add(6, 'M')
    data.push({
      date: date.valueOf(),
      value: (Math.random() - 0.5) * 100
    });
  }

  var interval = d3.extent(data, d => d.value);
  var offset = (interval[1] - interval[0]) / 100 * 25;

  var extent = [interval[0] + offset, interval[1] - offset];

  return {
    data: data,
    extent: extent,
    comments: getRandomArrayElements(data, getRandomIntInclusive(1, 3))
  }
}

function getRandomArrayElements(arr, count) {

    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }

    return shuffled.slice(min);
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}
