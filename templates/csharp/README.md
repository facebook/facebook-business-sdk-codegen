# Facebook Business SDK for C#

This is an auto-generated C# SDK for the Facebook Marketing API.

## Installation

```bash
dotnet add package FacebookBusinessSDK
```

## Usage

```csharp
using Meta.Ads.SDK;

// Initialize API context
var accessToken = "your-access-token";
var context = new APIContext(accessToken);

// Create an API client
var adAccount = new AdAccount("act_1234567890", context);

// Fetch data
var account = await adAccount.FetchAsync();
Console.WriteLine(account.Name);
```

## Requirements

- .NET 6.0 or higher
- Newtonsoft.Json (Json.NET)

## Documentation

For full documentation, see [Facebook Marketing API docs](https://developers.facebook.com/docs/marketing-apis).

## License

Meta Platforms, Inc. and affiliates. All rights reserved.
