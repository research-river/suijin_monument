import { TerrainLayer } from '@deck.gl/geo-layers';

/**
 * 国土地理院標高タイル専用のTerrainLayer
 *
 * 国土地理院の標高タイルの計算式：
 * h = x * 2^16 + y * 2^8 + z
 * ここで、x はRの下位4ビット、y はG、z はB
 *
 * 簡略化すると:
 * h = (R & 0x0F) * 65536 + G * 256 + B
 *
 * ただし、x < 128 の場合（つまり R < 128）:
 * h = R * 655.36 + G * 2.56 + B * 0.01
 *
 * 標高 = h * 0.01 メートル (単位が0.01m)
 */
export class GsiTerrainLayer extends TerrainLayer {
    static defaultProps = {
        ...TerrainLayer.defaultProps,
        // デフォルトのエンコーディング設定
        elevationDecoder: {
            rScaler: 6.5536,    // 655.36 * 0.01
            gScaler: 0.0256,    // 2.56 * 0.01
            bScaler: 0.0001,    // 0.01 * 0.01
            offset: 0
        }
    };
}
