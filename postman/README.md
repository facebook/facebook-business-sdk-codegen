# Facebook Marketing API- Postman Collection

A Postman collection is a set of saved HTTP requests used to learn how to use a specific API. It encloses most common calls to an API that can be done, as well as the parameters or headers needed to successfully use it. They encapsulate those resources in a tidy way to save, reuse and share with others. Using them allows developers to quickly onboard and understand the way Marketing API works by generating documented requests with examples. This collection allows developers to create campgain, edit campgaign, create Adset/Ads and also view the insights for your ads.To use the Facebook Marketing API Postman Collection following pre-condition need to be met. For more updated information about Marketing API refer to the official documentation[https://developers.facebook.com/docs/marketing-apis/get-started]

### Pre-condition
1. Account ID
2. Import collection and env variable to postman
3. Update global variable: account_id and token. Please refer to documentation on getting long lived token[https://developers.facebook.com/docs/marketing-apis/overview/authentication]
4. Create Env variable in Postman. As you execute the script variable used to store campaign id, ad id etc will be auto populated here.
5. You should now be able to execute the campaign creation, search for Targeting interest, view account level metrics, creating Adsets, get existing Adsets and Ads details.
6. To create Ads you will need creative_id; this can be done either by executing get creative script or by creating new creatives
