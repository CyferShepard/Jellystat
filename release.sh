#!/bin/bash

PREVIOUS_VERSION=$(git describe --abbrev=0 --tags)

echo "Choose the version component to increment:"
echo "1. Major"
echo "2. Minor"
echo "3. Patch"

read -p "Enter your choice: " choice

case $choice in
    1)
        # Increment the major version
        MAJOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f1)
        MAJOR=$((MAJOR + 1))
        NEW_VERSION="$MAJOR.0.0"
        ;;
    2)
        # Increment the minor version
        MAJOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f1)
        MINOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f2)
        MINOR=$((MINOR + 1))
        NEW_VERSION="$MAJOR.$MINOR.0"
        ;;
    3)
        # Increment the patch version
        MAJOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f1)
        MINOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f2)
        PATCH=$(echo "$PREVIOUS_VERSION" | cut -d. -f3)
        PATCH=$((PATCH + 1))
        NEW_VERSION="$MAJOR.$MINOR.$PATCH"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Tag message
TAG_MESSAGE="Release version $NEW_VERSION"

# Create a new tag
git tag -a "$NEW_VERSION" -m "$TAG_MESSAGE"

# Push the tag to the remote repository
git push origin "$NEW_VERSION"

echo "Tag $NEW_VERSION has been created and pushed to the remote repository."
