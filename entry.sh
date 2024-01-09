#!/bin/sh

load_secrets() {
  # Treat all env vars that start with the prefix 'FILE__' as secrets,
  # loading their contents into a variable without the prefix.

  # Loop through all env vars starting with 'FILE__'
  for var in $(env | grep '^FILE__'); do
    var_name=$(echo "${var}" | cut -d= -f1)
    var_value=$(echo "${var}" | cut -d= -f2)

    # Ensure var value is a file
    if [ -f "${var_value}" ]; then

      # Strip 'FILE__' prefix to obtain corresponding variable name
      new_var_name="${var_name#FILE__}"

      # Notify user if original variable is being overwritten.
      if [ -n "$(eval echo \$$new_var_name)" ]; then
        echo "Warning: ${new_var_name} was already set but is being overwritten by $var_name"
      fi
      # Set the new variable with the secret value
      export "${new_var_name}=$(cat "${var_value}")"
    else
      echo "Error: Secret file '${var_value}' does not exist"
      exit 1
    fi
  done
}

# Load secrets
load_secrets
# Launch Jellystat
npm run start
