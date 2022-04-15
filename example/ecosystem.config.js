module.exports =
{
    apps:
    [
        {
            name: "Webhook Forwarder",
            script: "./index.js",
            watch: true,
            "ignore_watch" : ["./static/", "./.idea/"],
            env:
            {
                "PORT": 3000,
                "NODE_ENV": "development",
            },
            env_production:
            {
                "PORT": 3000,
                "NODE_ENV": "production",
            },
            args:
            [
                "--color"
            ]
        }
    ]
}