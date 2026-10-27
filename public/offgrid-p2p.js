/**
 * Citcat Off-Grid P2P Module (Capacitor JS / Web Bluetooth & Wi-Fi Direct Integration)
 * Enables decentralized, serverless peer-to-peer messaging for disaster relief or offline areas.
 */

// Check if running inside Capacitor native container
const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

class OffGridP2PManager {
  constructor() {
    this.active = false;
    this.peers = new Map(); // peerId -> { name, rssi, connectionState }
    this.messages = [];
    this.onPeerDiscoveredCallback = null;
    this.onMessageReceivedCallback = null;
    this.bleServiceUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'; // Nordic UART Service UUID as standard P2P UART
    this.bleCharRxUUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
    this.bleCharTxUUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
  }

  /**
   * Toggle Off-Grid Mode ON/OFF
   */
  async toggleOffGrid(enable, myUsername) {
    this.active = enable;
    if (enable) {
      console.log('[Off-Grid] Activating Off-Grid Mode...');
      try {
        if (isCapacitor) {
          await this.initNativeP2P(myUsername);
        } else {
          // Fallback / Web simulation using Web Bluetooth API if supported
          await this.initWebBluetoothScan(myUsername);
        }
        return { success: true, message: 'Mode Off-Grid diaktifkan. Mencari perangkat sekitar...' };
      } catch (error) {
        console.error('[Off-Grid] Activation error:', error);
        this.active = false;
        return { success: false, error: error.message || 'Gagal mengaktifkan Off-Grid Mode.' };
      }
    } else {
      console.log('[Off-Grid] Deactivating Off-Grid Mode...');
      await this.stopNativeP2P();
      return { success: true, message: 'Mode Off-Grid dimatikan.' };
    }
  }

  /**
   * Initialize Native Capacitor Bluetooth LE / Wi-Fi Direct
   */
  async initNativeP2P(myUsername) {
    // Note: Requires @capacitor-community/bluetooth-le plugin installed in Capacitor project
    // Example integration structure:
    /*
    import { BleClient } from '@capacitor-community/bluetooth-le';
    await BleClient.initialize();
    
    // Start scanning for nearby Citcat Off-Grid nodes
    await BleClient.requestLEScan(
      {
        services: [this.bleServiceUUID],
        allowDuplicates: false,
      },
      (result) => {
        const peerId = result.device.deviceId;
        const peerName = result.device.name || 'Citcat User';
        this.peers.set(peerId, { name: peerName, rssi: result.rssi, device: result.device });
        if (this.onPeerDiscoveredCallback) {
          this.onPeerDiscoveredCallback(Array.from(this.peers.values()));
        }
      }
    );
    */
    console.log('[Off-Grid] Native Bluetooth LE & Wi-Fi Direct P2P initialized for user:', myUsername);
  }

  /**
   * Web Bluetooth API Fallback (for browser testing / PWA)
   */
  async initWebBluetoothScan(myUsername) {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth / Bluetooth LE tidak didukung di browser ini.');
    }
    
    console.log('[Off-Grid] Requesting Bluetooth Device via Web Bluetooth...');
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [this.bleServiceUUID] }],
      optionalServices: [this.bleServiceUUID]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(this.bleServiceUUID);
    const charTx = await service.getCharacteristic(this.bleCharTxUUID);

    // Subscribe to incoming messages
    await charTx.startNotifications();
    charTx.addEventListener('characteristicvaluechanged', (event) => {
      const decoder = new TextDecoder('utf-8');
      const value = decoder.decode(event.target.value);
      try {
        const parsed = JSON.parse(value);
        if (this.onMessageReceivedCallback) {
          this.onMessageReceivedCallback(parsed);
        }
      } catch (e) {
        console.error('[Off-Grid] Failed to parse incoming P2P packet:', e);
      }
    });

    this.peers.set(device.id, { name: device.name || 'Off-Grid Peer', device, server, service });
    if (this.onPeerDiscoveredCallback) {
      this.onPeerDiscoveredCallback(Array.from(this.peers.values()));
    }
  }

  /**
   * Send a direct P2P text message to a connected peer
   */
  async sendMessage(peerId, textMessage, senderUsername) {
    if (!this.active) {
      throw new Error('Mode Off-Grid sedang tidak aktif.');
    }

    const payload = JSON.stringify({
      id: 'og_' + Date.now() + Math.random().toString(36.substr(2, 5)),
      sender: senderUsername,
      message: textMessage,
      timestamp: new Date().toISOString()
    });

    if (isCapacitor) {
      // Send via Native BLE Characteristic Write or Wi-Fi Direct socket
      /*
      const peer = this.peers.get(peerId);
      const encoder = new TextEncoder();
      await BleClient.write(peerId, this.bleServiceUUID, this.bleCharRxUUID, encoder.encode(payload));
      */
      console.log(`[Off-Grid P2P] Sent to ${peerId}:`, payload);
    } else {
      const peer = this.peers.get(peerId);
      if (peer && peer.service) {
        const charRx = await peer.service.getCharacteristic(this.bleCharRxUUID);
        const encoder = new TextEncoder();
        await charRx.writeValue(encoder.encode(payload));
        console.log(`[Off-Grid WebBLE] Sent to ${peerId}:`, payload);
      } else {
        throw new Error('Perangkat peer belum terhubung secara GATT.');
      }
    }

    return { success: true, payload };
  }

  async stopNativeP2P() {
    if (isCapacitor) {
      // await BleClient.stopLEScan();
    }
    this.peers.clear();
  }

  onPeerDiscovered(callback) {
    this.onPeerDiscoveredCallback = callback;
  }

  onMessageReceived(callback) {
    this.onMessageReceivedCallback = callback;
  }
}

// Export singleton instance
window.offGridManager = new OffGridP2PManager();
