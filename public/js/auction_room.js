const socketio = io();
const form = document.getElementById('bidForm');

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