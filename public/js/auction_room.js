const socketio = io();
const form = document.getElementById('bid_form');
const amount_form = document.getElementById('amount_form');
const bid_button = document.getElementById('bid_button'); // 入札ボタン
const bid_history = document.getElementById('bid_history'); // 入札履歴ボタン
const bid_history_modal = document.getElementById('bid_history_modal'); // 入札履歴モーダル
const bid_history_modal_lists = document.getElementById('bid_history_modal_lists'); // 入札履歴モーダルのリスト
bid_history_modal.style.display = "none"; // 初期状態非表示

const hour = document.getElementById("diff_hour");
const min = document.getElementById("diff_min");
const sec = document.getElementById("diff_sec");

// 残り時間カウントダウン
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

  // オークション終了時、カウントストップ
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
var timer = setInterval(countdown,10);

form.addEventListener('submit' , function(event){
  event.preventDefault();
  const sendData = {
    auctionid: auctionid,
    id: userid,
    name: username,
    amount: document.getElementById("amount_form").value,
  }

  $.ajax({
    type: "POST",
    url: "/auction",
    data: sendData,
  }).done(function(results){
    // console.log(results);
    alert("入札しました！ 入札金額は" + document.getElementById("amount_form").value + "円です。");
  }).fail(function(xhr, textStatus, errorThrown){
    console.log("ajax通信に失敗しました。");
  }).always(function(xhr){
  });

  socketio.emit('c2s' , sendData);
});

bid_history.addEventListener('click' , function(event){
  event.preventDefault();
  bid_history_modal.style.display = "block";
});

socketio.on('s2c' , function(msg){
  console.log('ソケットs2c: ' + msg);
  document.getElementById('now_amount').innerHTML = "現在価格: " + msg.amount;
  amount_form.value = msg.amount;
  amount_form.min = parseInt(msg.amount) + 1;
  // 入札履歴モーダルのリストに追加
  var li = document.createElement('li');
  li.innerHTML = "入札時間: " + new Date().toLocaleString() + " 入札者: " + msg.name + " 入札金額: " + msg.amount 
  bid_history_modal_lists.appendChild(li);
});

const sendData = {
  auctionid: auctionid,
}
socketio.emit('c2s-join' , sendData);