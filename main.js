import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { GsiTerrainLayer } from './GsiTerrainLayer.js';
import Papa from 'papaparse';

// グローバル変数
let deck;
let monumentsData = [];
let show3D = true;
let showMonuments = true;
let exaggeration = 1.0;
let pitch = 45;

// 初期ビューステート
const INITIAL_VIEW_STATE = {
    longitude: 139.404210,
    latitude: 35.939096,
    zoom: 11,
    pitch: 45,
    bearing: 0,
    maxPitch: 85
};

// 色設定
const MONUMENT_COLORS = {
    water: [0, 0, 255],      // 青
    dragon: [0, 128, 0],     // 緑
    benten: [255, 140, 0],   // オレンジ
    other: [0, 100, 0]       // 濃い緑
};

// 国土地理院3D地形レイヤー
function createGsiTerrainLayer() {
    if (!show3D) return null;

    console.log('GsiTerrainLayer生成: exaggeration=', exaggeration);

    return new GsiTerrainLayer({
        id: 'gsi-terrain',
        minZoom: 0,
        maxZoom: 14,
        elevationDecoder: {
            rScaler: 6.5536 * exaggeration,
            gScaler: 0.0256 * exaggeration,
            bScaler: 0.0001 * exaggeration,
            offset: 0
        },
        elevationData: 'https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png',
        texture: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
        wireframe: false,
        material: {
            diffuse: 0.8,
            ambient: 0.3,
            shininess: 32
        }
    });
}

// 石碑マーカーレイヤー
function createMonumentsLayer() {
    if (!showMonuments || monumentsData.length === 0) return null;

    return new ScatterplotLayer({
        id: 'monuments',
        data: monumentsData,
        pickable: true,
        opacity: 0.9,
        stroked: true,
        filled: true,
        radiusScale: 6,
        radiusMinPixels: 8,
        radiusMaxPixels: 100,
        lineWidthMinPixels: 2,
        billboard: true,
        getPosition: d => [parseFloat(d.lon), parseFloat(d.lat), 500],
        getRadius: d => 100,
        getFillColor: d => MONUMENT_COLORS[d.type] || [128, 128, 128],
        getLineColor: [0, 0, 0],
        onClick: ({object}) => {
            if (object) {
                alert(`${object.name || ''}\n建立年: ${object.year || ''}\n所在地: ${object.address || ''}`);
            }
        }
    });
}

// レイヤーを更新
function updateLayers() {
    const layers = [
        createGsiTerrainLayer(),
        createMonumentsLayer()
    ].filter(layer => layer !== null);

    console.log('レイヤー更新:', layers.length, '個');
    console.log('3D表示:', show3D, 'exaggeration:', exaggeration);

    if (deck) {
        deck.setProps({ layers });
    }
}

// Deck.gl初期化
function initDeck() {
    deck = new Deck({
        container: 'map',
        initialViewState: INITIAL_VIEW_STATE,
        controller: true,
        onViewStateChange: ({viewState}) => {
            document.getElementById('zoom-level').textContent = `ズーム: ${viewState.zoom.toFixed(1)}`;
        }
    });

    updateLayers();
    console.log('Deck.gl初期化完了');
}

// 石碑データの読み込み
async function loadMonuments() {
    try {
        console.log('石碑データ読み込み開始...');
        const response = await fetch('./restart.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            complete: (results) => {
                monumentsData = results.data.filter(row => row.lat && row.lon);
                console.log('石碑データ読み込み完了:', monumentsData.length, '件');
                updateLayers();
            }
        });
    } catch (error) {
        console.error('石碑データの読み込みエラー:', error);
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // 地形の高さ倍率変更
    document.getElementById('exaggeration-slider').addEventListener('input', (e) => {
        exaggeration = parseFloat(e.target.value);
        document.getElementById('exaggeration-val').textContent = exaggeration.toFixed(1);
        console.log('高さ倍率変更:', exaggeration);
        if (show3D) {
            updateLayers();
        }
    });

    // 視点の傾き変更
    document.getElementById('pitch-slider').addEventListener('input', (e) => {
        pitch = parseInt(e.target.value);
        document.getElementById('pitch-val').textContent = pitch;
        const viewState = deck.viewState || INITIAL_VIEW_STATE;
        deck.setProps({
            initialViewState: {
                ...viewState,
                pitch: pitch
            }
        });
    });

    // 3D地形表示切り替え
    document.getElementById('layer-3d').addEventListener('change', (e) => {
        show3D = e.target.checked;
        console.log('3D地形表示:', show3D);
        updateLayers();
    });

    // 石碑マーカー切り替え
    document.getElementById('layer-monuments').addEventListener('change', (e) => {
        showMonuments = e.target.checked;
        console.log('石碑表示:', showMonuments);
        updateLayers();
    });
}

// 初期化
async function init() {
    initDeck();
    await loadMonuments();
    setupEventListeners();
    document.getElementById('loading').style.display = 'none';
    console.log('初期化完了');
}

// ページ読み込み時に実行
window.addEventListener('load', init);
