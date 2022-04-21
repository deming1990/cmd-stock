const Axios = require('axios')
const iconv = require('iconv-lite')
const Jetty = require("jetty")

const jetty = new Jetty(process.stdout)

// 示例
// https://qt.gtimg.cn/q=sh603599,sz002153
const BASE_URL = 'https://qt.gtimg.cn/q='
const STOCKS = [
  'sh603599',
  'sh688311', 
  'sz002153'
]
// 间隔时间最好别太短，超短线不适合摸鱼 哈哈
const INTERVAL = 5000

const ajax = Axios.create()

const getStocksData = () => {
  return new Promise((resolve, reject) => {
    ajax.get(BASE_URL + STOCKS.join(','), {
      timeout: 5000,
      responseType : 'stream'
    }).then((res) => {
      let chunks = [];
      res.data.on('data',chunk=>{
          chunks.push(chunk);
      });
      res.data.on('end',()=>{
          let buffer = Buffer.concat(chunks);
          let str = iconv.decode(buffer,'gbk');
          resolve(str)
      })
    }).catch(err => {
      reject(err)
    })
  })
}

const handleStockData = (str) => {
  const reg = /"(.*)"/
  let arr = str.split('\n').slice(0,-1)
  return arr.map(item => {
    const data = reg.exec(item)[1].split('~')
    return {
      no: data[2],
      name: data[1],
      currentPrice: data[3],
      yesterdayPrice: data[4],
      change: data[32],
      max: data[33],
      min: data[34]
    }
  })
}

const printStocks = (stocks) => {
  const date = new Date()
  jetty.clear()
  jetty.moveTo([0, 0])
  jetty.text('代码\t\t名称\t\t当前\t\t昨收\t\t涨跌\t\t最高\t\t最低\n')
  jetty.text('\n')
  stocks.forEach(item => {
    jetty.text(`${item.no}\t\t${item.name}\t${item.currentPrice}\t\t${item.yesterdayPrice}\t\t${item.change}%\t\t${item.max}\t\t${item.min}\n`)
  })
  jetty.text('\n')
  jetty.text(`刷新间隔: ${INTERVAL} ms`)
  jetty.text('\n')
  jetty.text(`当前时间: ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
}

function run() {
  getStocksData()
    .then(handleStockData)
    .then(printStocks)
    .catch(err => console.error(err))
}

run()
setInterval(run, INTERVAL)
