const socketio = io();
const form = document.getElementById('bid_form');
const amount_form = document.getElementById('amount_form');
const bid_button = document.getElementById('bid_button'); // 入札ボタン

const hour = document.getElementById("diff_hour");
const min = document.getElementById("diff_min");
const sec = document.getElementById("diff_sec");

function countdown() {
  const now = new Date();
  const diff = ending_time - now.getTime();

  // ミリ秒から単位を修正
  const calcHour = Math.floor(diff / 1000 / 60 / 60);
  const calcMin = Math.floor(diff / 1000 / 60) % 60;
  const calcSec = Math.floor(diff / 1000) % 60;

  // 取得した時間を表示（2桁表示）
  hour.innerHTML = calcHour < 10 ? '0' + calcHour : calcHour;
  min.innerHTML = calcMin < 10 ? '0' + calcMin : calcMin;
  sec.innerHTML = calcSec < 10 ? '0' + calcSec : calcSec;

  if(diff <= 0) {
    clearInterval(timer);
    hour.innerHTML = '00';
    min.innerHTML = '00';
    sec.innerHTML = '00';

    amount_form.disabled = true;
    bid_button.disabled = true;
    bid_button.value = '終了しました';
  }
}
countdown();
var timer = setInterval(countdown,1000);

form.addEventListener('submit' , function(event){
  event.preventDefault();
  const sendData = {
    auctionid: auctionid,
    id: userid,
    amount: document.getElementById("amount_form").value,
  }

  $.ajax({
    type: "POST",
    url: "/auction",
    data: sendData,
  }).done(function(results){
    console.log(results);
  }).fail(function(xhr, textStatus, errorThrown){
    console.log("ajax通信に失敗しました。");
  }).always(function(xhr){
  });

  socketio.emit('c2s' , sendData);
});

socketio.on('s2c' , function(msg){
  console.log('ソケットs2c: ' + msg);
  document.getElementById('now_amount').innerHTML = "現在価格: " + msg.amount;
  document.getElementById('amount_form').value = msg.amount;
  document.getElementById('amount_form').min = parseInt(msg.amount) + 1;

});

const sendData = {
  auctionid: auctionid,
}
socketio.emit('c2s-join' , sendData);