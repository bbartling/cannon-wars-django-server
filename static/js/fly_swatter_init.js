// Preload fly sprite frames for the fly swatter game
window.addEventListener('load', function() {
  window.flyFrames = [];
  var img0 = new Image();
  img0.src = '/static/games/fly_swatter/fly_sprite_0.png';
  var img1 = new Image();
  img1.src = '/static/games/fly_swatter/fly_sprite_1.png';
  window.flyFrames.push(img0, img1);
});