import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

let _connection: HubConnection | null = null;

export async function startConnection(token: string): Promise<HubConnection> {
  if (_connection?.state === HubConnectionState.Connected) return _connection;

  _connection = new HubConnectionBuilder()
    .withUrl("/hubs/notifications", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  await _connection.start();
  return _connection;
}

export async function stopConnection(): Promise<void> {
  if (_connection) {
    await _connection.stop();
    _connection = null;
  }
}
