var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('animeCubeMap').appendChild(renderer.domElement);
var src = [
    "./img/cubeMap/JE_1.20_panorama_1.webp", // right
    "./img/cubeMap/JE_1.20_panorama_3.webp", // left
    "./img/cubeMap/JE_1.20_panorama_4.webp", // top
    "./img/cubeMap/JE_1.20_panorama_5.webp", // bottom
    "./img/cubeMap/JE_1.20_panorama_0.webp", // front
    "./img/cubeMap/JE_1.20_panorama_2.webp" // back
   ];   
var loader = new THREE.CubeTextureLoader();
scene.background = loader.load(src);

var animate = function () {
requestAnimationFrame(animate);
// 在这里添加旋转代码
camera.rotation.y += 0.0005;
renderer.render(scene, camera);
};
window.addEventListener('resize', function() {
renderer.setSize(window.innerWidth, window.innerHeight);
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
});
animate();